import { setup } from "xstate"

export const createDetourMachine = setup({
  types: {} as {
    events:
      | { type: "detour.edit.done" }
      | { type: "detour.edit.resume" }
  },
}).createMachine({
  id: "Detours Machine",

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
