import { setup, assign, fromPromise, ActorLogicFrom, InputFrom } from "xstate"
import { Route, RouteId, RoutePattern } from "../schedule"
import { fetchRoutePatterns } from "../api"

export const createDetourMachine = setup({
  types: {} as {
    context: {
      route?: Route
      routePattern?: RoutePattern

      routePatterns?: RoutePattern[]
    }

    input:
      | {
          // Caller has target route pattern
          route: Route
          routePattern: RoutePattern
        }
      | {
          // Caller has target route
          route: Route
          routePattern: undefined
        }
      | {
          // Caller has no prior selection
          route: undefined
          routePattern: undefined
        }

    events:
      | { type: "detour.edit.done" }
      | { type: "detour.edit.resume" }
      | { type: "detour.route-pattern.open" }
      | { type: "detour.route-pattern.done" }
      | { type: "detour.route-pattern.delete-route" }
      | { type: "detour.route-pattern.select-route"; route: Route }
      | {
          type: "detour.route-pattern.select-pattern"
          routePattern: RoutePattern
        }
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
  },
  actions: {
    "set.route-pattern": assign({
      routePattern: (_, params: { routePattern: RoutePattern }) =>
        params.routePattern,
    }),
    "set.route-id": assign({
      route: (_, params: { route: Route }) => params.route,
    }),
  },
}).createMachine({
  id: "Detours Machine",
  context: ({ input }) => ({
    ...input,
  }),

  initial: "Detour Drawing",
  states: {
    "Detour Drawing": {
      initial: "Begin",
      states: {
        Begin: {
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
          on: {
            "detour.route-pattern.open": {
              target: "Pick Route Pattern",
            },
            "detour.edit.done": {
              target: "Share Detour",
            },
          },
        },
        "Share Detour": {
          on: {
            "detour.edit.resume": {
              target: "Editing",
            },
          },
        },
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
