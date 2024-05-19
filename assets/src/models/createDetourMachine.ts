import { setup, ActorLogicFrom, InputFrom } from "xstate"
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

    events: { type: "detour.edit.done" } | { type: "detour.edit.resume" }
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
          states: {
            "Pick Route ID": {
            },
            "Pick Route Pattern": {
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
