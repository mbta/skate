import { setup, assign, fromPromise, ActorLogicFrom, InputFrom } from "xstate"
import { RoutePatternId, ShapePoint } from "../schedule"
import { Route, RouteId, RoutePattern } from "../schedule"
import { Ok, Result } from "../util/result"
import {
  FetchDetourDirectionsError,
  fetchDetourDirections,
  fetchFinishedDetour,
  fetchRoutePatterns,
} from "../api"
import { DetourShape, FinishedDetour } from "./detour"

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

      detourShape: Result<DetourShape, FetchDetourDirectionsError> | undefined

      finishedDetour: FinishedDetour | undefined | null
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
      | { type: "detour.share.copy-detour"; detourText: string }
      | { type: "detour.share.activate" }
      | { type: "detour.active.deactivate" }
      | { type: "detour.save.begin-save" }
      | { type: "detour.save.set-uuid"; uuid: number },

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
  },
}).createMachine({
  id: "Detours Machine",
  context: ({ input }) => ({
    ...input,
    waypoints: [],
    uuid: undefined,
    startPoint: undefined,
    endPoint: undefined,
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
                  actions: {
                    type: "detour.add-start-point",
                    params: ({ event: { location } }) => ({
                      location,
                    }),
                  },
                },
              },
            },
            "Place Waypoint": {
              invoke: {
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
              on: {
                "detour.edit.place-waypoint": {
                  target: "Place Waypoint",
                  reenter: true,
                  actions: {
                    type: "detour.add-waypoint",
                    params: ({ event: { location } }) => ({
                      location,
                    }),
                  },
                },
                "detour.edit.place-waypoint-on-route": {
                  target: "Finished Drawing",
                  actions: {
                    type: "detour.add-end-point",
                    params: ({ event: { location } }) => ({
                      location,
                    }),
                  },
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
              },
            },
            Done: {
              type: "final",
            },
          },

          onDone: {
            target: "Share Detour",
          },
        },
        "Share Detour": {
          on: {
            "detour.edit.resume": {
              target: "Editing.Finished Drawing",
            },
            "detour.share.activate": {
              target: "Active",
            },
          },
        },
        Active: {
          on: {
            "detour.active.deactivate": {
              target: "Past",
            },
          },
        },
        Past: {},
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
