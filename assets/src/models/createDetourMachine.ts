import { setup, ActorLogicFrom, InputFrom } from "xstate"
import { Route, RoutePattern } from "../schedule"

export const createDetourMachine = setup({
  types: {} as {
    context: {
      route: Route
      routePattern: RoutePattern
    }

    input: {
      // Caller has target route pattern
      route: Route
      routePattern: RoutePattern
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
