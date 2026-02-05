import { setup, assign, fromPromise, ActorLogicFrom, InputFrom } from "xstate"
import { RoutePatternId, ShapePoint } from "../schedule"
import { Route, RouteId, RoutePattern } from "../schedule"
import { isOk, Ok, Result } from "../util/result"
import {
  FetchDetourDirectionsError,
  fetchDetourDirections,
  fetchFinishedDetour,
  fetchNearestIntersection,
  fetchRoutePatterns,
  activateDetour,
} from "../api"
import { DetourShape, FinishedDetour } from "./detour"
import { fullStoryEvent } from "../helpers/fullStory"
import { type, optional, coerce, date, string } from "superstruct"

export const createDetourMachine = setup({
  types: {
    context: {} as {
      uuid: number | undefined
      route?: Route
      routePattern?: RoutePattern

      routePatterns?: RoutePattern[]

      waypoints: ShapePoint[]
      startPoint: ShapePoint | undefined
      endPoint: ShapePoint | undefined

      nearestIntersection: string | null

      detourShape: Result<DetourShape, FetchDetourDirectionsError> | undefined

      finishedDetour: FinishedDetour | undefined | null

      editedDirections?: string

      selectedDuration?: string
      selectedReason?: string

      activatedAt?: Date

      editedSelectedDuration?: string
    },

    input: {} as
      | {
          // Caller has target route pattern
          route: Route
          routePattern: RoutePattern
        }
      | {
          // Caller has target route
          route: Route
          routePattern?: undefined
        }
      | {
          // Caller has no prior selection
          route?: undefined
          routePattern?: undefined
        },

    events: {} as
      | { type: "detour.route-pattern.open" }
      | { type: "detour.route-pattern.done" }
      | { type: "detour.route-pattern.delete-route" }
      | { type: "detour.route-pattern.select-route"; route: Route }
      | {
          type: "detour.route-pattern.select-pattern"
          routePattern: RoutePattern
        }
      | { type: "detour.edit.done" }
      | { type: "detour.edit.resume" }
      | { type: "detour.edit.clear-detour" }
      | { type: "detour.edit.place-waypoint-on-route"; location: ShapePoint }
      | { type: "detour.edit.place-waypoint"; location: ShapePoint }
      | { type: "detour.edit.undo" }
      | { type: "detour.share.edit-directions"; detourText: string }
      | { type: "detour.share.copy-detour"; detourText: string }
      | { type: "detour.share.open-activate-modal" }
      | { type: "detour.share.activate" }
      | {
          type: "detour.share.activate-modal.select-duration"
          duration: string
        }
      | {
          type: "detour.share.activate-modal.select-reason"
          reason: string
        }
      | { type: "detour.share.activate-modal.next" }
      | { type: "detour.share.activate-modal.cancel" }
      | { type: "detour.share.activate-modal.back" }
      | { type: "detour.share.activate-modal.activate" }
      | { type: "detour.active.open-change-duration-modal" }
      | {
          type: "detour.active.change-duration-modal.select-duration"
          duration: string
        }
      | { type: "detour.active.change-duration-modal.done" }
      | { type: "detour.active.change-duration-modal.cancel" }
      | { type: "detour.active.open-deactivate-modal" }
      | { type: "detour.active.deactivate-modal.deactivate" }
      | { type: "detour.active.deactivate-modal.cancel" }
      | { type: "detour.active.edit.resume" }
      | { type: "detour.active.edit.done" }
      | { type: "detour.active.edit.cancel" }
      | { type: "detour.save.begin-save" }
      | { type: "detour.save.set-uuid"; uuid: number }
      | { type: "detour.delete.open-delete-modal" }
      | { type: "detour.delete.delete-modal.cancel" }
      | { type: "detour.delete.delete-modal.delete-draft" },

    // We're making an assumption that we'll never want to save detour edits to the database when in particular stages
    // of detour drafting:
    // -- when starting a detour, before any user input
    // -- when the route id / route pattern is getting selected
    // -- right after the route pattern is finalized, before any waypoints are added
    // That leads to the following interface: if the user begins drafting a detour, adds waypoints, and then changes the route,
    // the database will reflect the old route and old waypoints up until the point where a new waypoint is added.
    // If that UX assumption isn't the right one, we can iterate in the future!
    tags: "no-save",
  },
  actors: {
    "fetch-route-patterns": fromPromise<
      Awaited<ReturnType<typeof fetchRoutePatterns>>,
      { routeId?: RouteId }
    >(async ({ input: { routeId } }) => {
      if (routeId) {
        return fetchRoutePatterns(routeId)
      } else {
        // Hmm, this could leave us in the lurch if we don't handle it,
        // I'd like to make this impossible but I can't get typescript to infer
        // the context types but it's not letting me
        throw "No Route ID"
      }
    }),

    "fetch-nearest-intersection": fromPromise<
      Awaited<string>,
      {
        startPoint?: ShapePoint
      }
    >(async ({ input: { startPoint } }) => {
      if (!startPoint) {
        throw "Missing nearest intersection inputs"
      }

      const intersection = await fetchNearestIntersection(
        startPoint.lat,
        startPoint.lon
      )
      if (intersection === null) {
        throw new Error("Retrieving Intersection Failed")
      }
      return intersection
    }),

    "fetch-detour-directions": fromPromise<
      Awaited<ReturnType<typeof fetchDetourDirections>>,
      {
        points?: ShapePoint[]
      }
    >(async ({ input: { points } }) => {
      if (!points) {
        throw "Missing detour direction inputs"
      }
      if (points.length < 2) {
        return Ok({ coordinates: [], directions: undefined })
      }
      return fetchDetourDirections(points)
    }),

    "fetch-finished-detour": fromPromise<
      Awaited<ReturnType<typeof fetchFinishedDetour>>,
      {
        routePatternId?: RoutePatternId
        startPoint?: ShapePoint
        waypoints: ShapePoint[]
        endPoint?: ShapePoint
      }
    >(
      async ({
        input: { routePatternId, startPoint, waypoints, endPoint },
      }) => {
        if (!(routePatternId && startPoint && endPoint)) {
          throw "Missing finished detour inputs"
        }
        return fetchFinishedDetour(
          routePatternId,
          startPoint,
          waypoints,
          endPoint
        )
      }
    ),

    "activate-detour": fromPromise<
      { activated_at: Date },
      {
        uuid?: number
        selectedDuration?: string
        selectedReason?: string
      }
    >(async ({ input: { uuid, selectedDuration, selectedReason } }) => {
      if (!uuid || !selectedDuration || !selectedReason) {
        throw "Missing activation inputs"
      }

      const result = await activateDetour(
        uuid,
        selectedDuration,
        selectedReason
      )

      if (isOk(result)) {
        return result.ok
      } else {
        throw "Failed to activate detour"
      }
    }),
  },
  actions: {
    "set.route-pattern": assign({
      routePattern: (_, params: { routePattern: RoutePattern }) =>
        params.routePattern,
    }),
    "set.route-id": assign({
      route: (_, params: { route: Route }) => params.route,
    }),
    "detour.add-start-point": assign({
      startPoint: (_, params: { location: ShapePoint }) => params.location,
    }),
    "detour.remove-start-point": assign({
      startPoint: undefined,
      detourShape: undefined,
    }),
    "detour.add-waypoint": assign({
      waypoints: ({ context }, params: { location: ShapePoint }) => [
        ...context.waypoints,
        params.location,
      ],
    }),
    "detour.remove-last-waypoint": assign({
      waypoints: ({ context }) => context.waypoints.slice(0, -1),
    }),
    "detour.add-end-point": assign({
      endPoint: (_, params: { location: ShapePoint }) => params.location,
    }),
    "detour.remove-end-point": assign({
      endPoint: undefined,
      finishedDetour: undefined,
    }),
    "detour.clear": assign({
      startPoint: undefined,
      waypoints: [],
      endPoint: undefined,
      finishedDetour: undefined,
      detourShape: undefined,
    }),
    "set.nearest-intersection-fallback": assign({
      nearestIntersection: "—",
    }),
  },
}).createMachine({
  id: "Detours Machine",
  context: ({ input }) => ({
    ...input,
    waypoints: [],
    uuid: undefined,
    startPoint: undefined,
    endPoint: undefined,
    nearestIntersection: null,
    finishedDetour: undefined,
    detourShape: undefined,
  }),
  type: "parallel",
  initial: "Detour Drawing",
  states: {
    "Detour Drawing": {
      initial: "Begin",

      states: {
        Begin: {
          tags: "no-save",
          always: [
            {
              guard: ({ context }) =>
                context.routePattern !== undefined &&
                context.route !== undefined,
              target: "Editing",
            },
            { target: "Pick Route Pattern" },
          ],
        },

        "Pick Route Pattern": {
          initial: "Pick Route ID",
          tags: "no-save",
          on: {
            "detour.route-pattern.select-route": {
              target: ".Pick Route ID",
              actions: assign({
                route: ({ event }) => event.route,
              }),
            },
            "detour.route-pattern.delete-route": {
              target: ".Pick Route ID",
              actions: assign({
                route: undefined,
                routePattern: undefined,
                routePatterns: undefined,
              }),
            },
          },
          states: {
            "Pick Route ID": {
              /**
               * This is intentionally left empty because the only way to
               * "Pick Route Pattern" is to pick a Route ID, but the Route ID
               * is allowed to change at any point while inside the
               * "#Detours Machine.Detour Drawing.Pick Route Pattern" state.
               */

              invoke: {
                src: "fetch-route-patterns",

                input: ({ context: { route } }) => ({ routeId: route?.id }),
                /** If this is not present, then this error propagates and causes the machine to stop receiving events */
                onError: {},
                onDone: {
                  target: "Finalize Route Pattern",
                  actions: assign({
                    routePatterns: ({ event }) => event.output,
                    routePattern: ({ context, event }) =>
                      // If we currently have a route pattern
                      context.routePattern &&
                      // And the current route pattern matches the current route ID
                      context.routePattern.routeId === context.route?.id
                        ? // Return the current route pattern
                          context.routePattern
                        : // Otherwise: Find the first pattern that's "Inbound"
                          event.output.find(
                            (pattern) => pattern.directionId === 1
                          ) ??
                          // Otherwise fallback to the first pattern in the list (which _could_ be empty)
                          event.output.at(0),
                  }),
                },
              },
              initial: "Idle",
              states: {
                Idle: {
                  after: {
                    100: {
                      target: "Loading",
                    },
                  },
                },
                Loading: {},
                // Note/Idea: if more "error" states are added, consider if
                // making them child states of a `Error` parent state would
                // be a worthwhile grouping
                "Error: No Route": {},
              },
              on: {
                "detour.route-pattern.done": {
                  target: ".Error: No Route",
                },
              },
            },
            "Finalize Route Pattern": {
              on: {
                "detour.route-pattern.done": {
                  guard: ({ context }) => context.routePattern !== undefined,
                  target: "Done",
                },
                "detour.route-pattern.select-pattern": {
                  actions: {
                    type: "set.route-pattern",
                    params: ({ event: { routePattern } }) => ({
                      routePattern,
                    }),
                  },
                },
              },
            },
            Done: {
              type: "final",
            },
          },
          onDone: {
            target: "Editing",
          },
        },

        Editing: {
          initial: "Pick Start Point",
          on: {
            "detour.route-pattern.open": {
              target: "Pick Route Pattern",
              actions: "detour.clear",
            },
            "detour.edit.clear-detour": {
              target: ".Pick Start Point",
              actions: "detour.clear",
            },
          },
          states: {
            "Pick Start Point": {
              tags: "no-save",
              on: {
                "detour.edit.place-waypoint-on-route": {
                  target: "Place Waypoint",
                  actions: [
                    {
                      type: "detour.add-start-point",
                      params: ({ event: { location } }) => ({
                        location,
                      }),
                    },
                    () => {
                      fullStoryEvent("Placed Detour Start Point", {})
                    },
                    "set.nearest-intersection-fallback",
                  ],
                },
                "detour.delete.open-delete-modal": {
                  target: "Deleting",
                },
              },
            },
            "Place Waypoint": {
              invoke: [
                {
                  src: "fetch-nearest-intersection",
                  input: ({ context: { startPoint } }) => ({
                    startPoint,
                  }),

                  onDone: {
                    actions: assign({
                      nearestIntersection: ({ event }) => event.output,
                    }),
                  },

                  onError: {
                    // fallback to an em-dash on error
                    actions: "set.nearest-intersection-fallback",
                  },
                },
                {
                  src: "fetch-detour-directions",
                  input: ({ context: { startPoint, waypoints } }) => ({
                    points: (startPoint ? [startPoint] : []).concat(
                      waypoints || []
                    ),
                  }),

                  onDone: {
                    actions: assign({
                      detourShape: ({ event }) => event.output,
                    }),
                  },

                  onError: {},
                },
              ],
              on: {
                "detour.edit.place-waypoint": {
                  target: "Place Waypoint",
                  reenter: true,
                  actions: [
                    {
                      type: "detour.add-waypoint",
                      params: ({ event: { location } }) => ({
                        location,
                      }),
                    },
                    () => {
                      fullStoryEvent("Placed Detour Way-Point", {})
                    },
                  ],
                },
                "detour.edit.place-waypoint-on-route": {
                  target: "Finished Drawing",
                  actions: [
                    {
                      type: "detour.add-end-point",
                      params: ({ event: { location } }) => ({
                        location,
                      }),
                    },
                    () => {
                      fullStoryEvent("Placed Detour End Point", {})
                    },
                  ],
                },
                "detour.edit.undo": [
                  {
                    guard: ({ context }) => context.waypoints.length === 0,
                    actions: "detour.remove-start-point",
                    target: "Pick Start Point",
                  },
                  {
                    actions: "detour.remove-last-waypoint",
                    reenter: true,
                    target: "Place Waypoint",
                  },
                ],
                "detour.delete.open-delete-modal": {
                  target: "Deleting",
                },
              },
            },
            "Finished Drawing": {
              invoke: {
                src: "fetch-finished-detour",
                input: ({
                  context: { routePattern, startPoint, waypoints, endPoint },
                }) => ({
                  routePatternId: routePattern?.id,
                  startPoint,
                  waypoints,
                  endPoint,
                }),

                onDone: {
                  actions: assign({
                    finishedDetour: ({ event }) => event.output,
                    detourShape: ({ event }) =>
                      event.output?.detourShape &&
                      Ok({
                        ...event.output.detourShape,
                        directions: event.output.detourShape.directions?.concat(
                          {
                            instruction: "Regular Route",
                          }
                        ),
                      }),
                  }),
                },

                onError: {},
              },

              on: {
                "detour.edit.undo": {
                  actions: "detour.remove-end-point",
                  target: "Place Waypoint",
                },
                "detour.edit.done": {
                  target: "Done",
                },
                "detour.delete.open-delete-modal": {
                  target: "Deleting",
                },
              },
            },
            Deleting: {
              on: {
                "detour.delete.delete-modal.cancel": {
                  target: "Place Waypoint",
                },
                "detour.delete.delete-modal.delete-draft": {
                  tags: "no-save",
                  target: "#Deleted",
                },
              },
            },
            Done: {
              type: "final",
            },
          },

          onDone: {
            target: "Share Detour",
            actions: assign({
              editedDirections: ({ context }) => {
                const detourShape =
                  context.detourShape && isOk(context.detourShape)
                    ? context.detourShape.ok
                    : null

                return [
                  "From " + context.nearestIntersection,
                  ...(detourShape?.directions?.map((v) => v.instruction) ?? []),
                ].join("\n")
              },
            }),
          },
        },

        "Share Detour": {
          initial: "Reviewing",
          on: {
            "detour.edit.resume": {
              target: "Editing.Finished Drawing",
            },
            "detour.share.activate": {
              target: "Active",
            },
          },
          states: {
            Reviewing: {
              on: {
                "detour.share.open-activate-modal": {
                  target: "Activating",
                },
                "detour.share.edit-directions": {
                  target: "Reviewing",
                  actions: assign({
                    editedDirections: ({ event }) => event.detourText,
                  }),
                },
                "detour.delete.open-delete-modal": {
                  target: "Deleting",
                },
              },
            },
            Activating: {
              initial: "Selecting Duration",
              on: {
                "detour.share.activate-modal.cancel": {
                  target: "Reviewing",
                },
              },
              states: {
                "Selecting Duration": {
                  initial: "Begin",
                  states: {
                    Begin: {
                      always: [
                        {
                          guard: ({ context: { selectedDuration } }) =>
                            selectedDuration === undefined,
                          target: "No Duration Selected",
                        },
                        { target: "Duration Selected" },
                      ],
                    },
                    "No Duration Selected": {},
                    "Duration Selected": {
                      on: {
                        "detour.share.activate-modal.next": {
                          target: "Done",
                        },
                      },
                    },
                    Done: {
                      type: "final",
                    },
                  },

                  on: {
                    "detour.share.activate-modal.select-duration": {
                      target: "Selecting Duration",
                      actions: assign({
                        selectedDuration: ({ event }) => event.duration,
                      }),
                    },
                  },
                  onDone: {
                    target: "Selecting Reason",
                  },
                },
                "Selecting Reason": {
                  initial: "Begin",
                  states: {
                    Begin: {
                      always: [
                        {
                          guard: ({ context: { selectedReason } }) =>
                            selectedReason === undefined,
                          target: "No Reason Selected",
                        },
                        { target: "Reason Selected" },
                      ],
                    },
                    "No Reason Selected": {},
                    "Reason Selected": {
                      on: {
                        "detour.share.activate-modal.next": {
                          target: "Done",
                        },
                      },
                    },
                    Done: {
                      type: "final",
                    },
                  },
                  on: {
                    "detour.share.activate-modal.back": {
                      target: "Selecting Duration",
                    },
                    "detour.share.activate-modal.select-reason": {
                      target: "Selecting Reason",
                      actions: assign({
                        selectedReason: ({ event }) => event.reason,
                      }),
                    },
                  },
                  onDone: {
                    target: "Confirming",
                  },
                },
                Confirming: {
                  on: {
                    "detour.share.activate-modal.back": {
                      target: "Selecting Reason",
                    },
                    "detour.share.activate-modal.activate": {
                      target: "Activating Server",
                    },
                  },
                },
                "Activating Server": {
                  invoke: {
                    id: "activate-detour",
                    src: "activate-detour",
                    input: ({
                      context: { uuid, selectedDuration, selectedReason },
                    }) => ({
                      uuid,
                      selectedDuration,
                      selectedReason,
                    }),
                    onDone: {
                      target: "Done",
                      actions: assign({
                        activatedAt: ({ event }) => event.output.activated_at,
                      }),
                    },
                    onError: {
                      // Still transition to Done even on error to allow the snapshot to save
                      target: "Done",
                      actions: ({ event }) => {
                        // Log error to Sentry
                        throw new Error(
                          `Failed to activate detour on server: ${event.error}`
                        )
                      },
                    },
                  },
                },
                Done: { type: "final" },
              },
              onDone: {
                target: "Done",
              },
            },
            Deleting: {
              on: {
                "detour.delete.delete-modal.cancel": {
                  target: "Reviewing",
                },
                "detour.delete.delete-modal.delete-draft": {
                  tags: "no-save",
                  target: "#Deleted",
                },
              },
            },
            Done: { type: "final" },
          },
          onDone: {
            target: "Active",
          },
        },

        Active: {
          initial: "Reviewing",
          states: {
            Reviewing: {
              on: {
                "detour.active.open-deactivate-modal": {
                  target: "Deactivating",
                },
                "detour.active.open-change-duration-modal": {
                  target: "Changing Duration",
                  actions: assign({
                    editedSelectedDuration: ({
                      context: { selectedDuration },
                    }) => selectedDuration,
                  }),
                },
              },
            },
            Deactivating: {
              on: {
                "detour.active.deactivate-modal.deactivate": {
                  target: "Done",
                },
                "detour.active.deactivate-modal.cancel": {
                  target: "Reviewing",
                },
              },
            },
            "Changing Duration": {
              on: {
                "detour.active.change-duration-modal.select-duration": {
                  target: "Changing Duration",
                  actions: assign({
                    editedSelectedDuration: ({ event }) => event.duration,
                  }),
                },
                "detour.active.change-duration-modal.done": {
                  target: "Reviewing",
                  actions: assign({
                    selectedDuration: ({
                      context: { editedSelectedDuration },
                    }) => editedSelectedDuration,
                  }),
                },
                "detour.active.change-duration-modal.cancel": {
                  target: "Reviewing",
                },
              },
            },
            Done: { type: "final" },
          },
          onDone: {
            target: "Past",
          },
        },

        Past: {},

        Deleted: {
          id: "Deleted",
          tags: "no-save",
          type: "final",
        },
      },
    },

    SaveState: {
      initial: "Unsaved",
      states: {
        Unsaved: {
          on: {
            "detour.save.begin-save": {
              target: "Saving",
            },
          },
        },
        Saving: {
          tags: "no-save",
          on: {
            "detour.save.set-uuid": {
              target: "Saved",
              actions: assign({
                uuid: ({ event }) => event.uuid,
              }),
            },
          },
        },
        Saved: {},
      },
    },
  },
})

/**
 * This refers to the type of `input` provided in
 * {@linkcode createDetourMachine}'s {@linkcode setup} call
 */
export type CreateDetourMachineInput = InputFrom<
  ActorLogicFrom<typeof createDetourMachine>
>

/**
 * Defines expected keys and type coercions in Superstruct to enable the
 * {@linkcode createDetourMachine} to use rich types when rehydrating from a
 * API response.
 */
export const DetourSnapshotData = type({
  context: type({
    // Convert serialized dates back into `Date`'s
    activatedAt: optional(coerce(date(), string(), (str) => new Date(str))),
  }),
})
