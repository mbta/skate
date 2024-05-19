import { setup, assign, ActorLogicFrom, InputFrom } from "xstate"
import { Route, RoutePattern } from "../schedule"

export const createDetourMachine = setup({
  types: {} as {
    context: {
      route?: Route
      routePattern?: RoutePattern
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
      | { type: "detour.route-pattern.select-route"; route: Route }
      | {
          type: "detour.route-pattern.select-pattern"
          routePattern: RoutePattern
        }
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
      initial: "Editing",
      states: {
        "Pick Route Pattern": {
          initial: "Pick Route ID",
          on: {
            "detour.route-pattern.select-route": {
              target: ".Pick Route Pattern",
              actions: assign({
                route: ({ event }) => event.route,
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
            },
            "Pick Route Pattern": {
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
