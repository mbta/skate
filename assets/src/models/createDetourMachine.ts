import { setup, assign } from "xstate"
import { ShapePoint } from "../schedule"

export const createDetourMachine = setup({
  types: {} as {
    context: {
      waypoints: ShapePoint[]
    }
    events:
      | { type: "detour.edit.clear-detour" }
      | { type: "detour.edit.done" }
      | { type: "detour.edit.place-connection-point"; location: ShapePoint }
      | { type: "detour.edit.place-waypoint"; location: ShapePoint }
      | { type: "detour.edit.resume" }
      | { type: "detour.edit.undo" }
      | { type: "detour.share.copy-detour"; detourText: string }
  },
  actions: {
    "detour.add-waypoint": assign({
      waypoints: ({ context }, params: { location: ShapePoint }) => [
        ...context.waypoints,
        params.location,
      ],
    }),
    "detour.remove-last-waypoint": assign({
      waypoints: ({ context }) => context.waypoints.slice(0, -1),
    }),
    "detour.clear": assign({
      waypoints: [],
    }),

    "detour.share.copy-detour": (_, { detourText }: { detourText: string }) => {
      window.navigator.clipboard?.writeText(detourText)
    },
  },
}).createMachine({
  id: "Detours Machine",
  context: () => ({
    waypoints: [],
  }),

  initial: "Detour Drawing",
  states: {
    "Detour Drawing": {
      initial: "Editing",
      states: {
        // ? Can this be modeled with a sub state machine as an actor?..
        Editing: {
          initial: "Pick Start Point",
          on: {
            "detour.edit.clear-detour": {
              target: ".Pick Start Point",
              actions: "detour.clear",
            },
          },
          states: {
            "Pick Start Point": {
              on: {
                "detour.edit.place-connection-point": {
                  target: "Place Waypoint",
                  actions: {
                    type: "detour.add-waypoint",
                    params: ({ event: { location } }) => ({
                      location,
                    }),
                  },
                },
              },
            },
            "Place Waypoint": {
              on: {
                "detour.edit.place-waypoint": {
                  actions: {
                    type: "detour.add-waypoint",
                    params: ({ event: { location } }) => ({
                      location,
                    }),
                  },
                },
                "detour.edit.place-connection-point": {
                  target: "Finished Drawing",
                  actions: {
                    type: "detour.add-waypoint",
                    params: ({ event: { location } }) => ({
                      location,
                    }),
                  },
                },
                "detour.edit.undo": [
                  {
                    guard: ({ context }) => context.waypoints.length === 1,
                    actions: "detour.remove-last-waypoint",
                    target: "Pick Start Point",
                  },
                  {
                    actions: "detour.remove-last-waypoint",
                    target: "Place Waypoint",
                  },
                ],
              },
            },
            "Finished Drawing": {
              on: {
                "detour.edit.undo": {
                  actions: "detour.remove-last-waypoint",
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
            "detour.share.copy-detour": {
              actions: {
                type: "detour.share.copy-detour",
                params: ({ event: { detourText } }) => ({ detourText }),
              },
            },
          },
        },
      },
    },
  },
})
