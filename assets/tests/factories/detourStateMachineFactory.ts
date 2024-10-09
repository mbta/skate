import { Factory } from "fishery"
import { createActor } from "xstate"
import { createDetourMachine } from "../../src/models/createDetourMachine"
import { originalRouteFactory } from "./originalRouteFactory"
import { shapePointFactory } from "./shapePointFactory"
import { DetourWithState } from "../../src/models/detour"

export const detourStateMachineFactory = Factory.define<DetourWithState>(() => {
  // Stub out a detour machine, and start a detour-in-progress
  const machine = createActor(createDetourMachine, {
    input: originalRouteFactory.build(),
  }).start()
  machine.send({
    type: "detour.edit.place-waypoint-on-route",
    location: shapePointFactory.build(),
  })
  machine.send({
    type: "detour.edit.place-waypoint",
    location: shapePointFactory.build(),
  })
  machine.send({
    type: "detour.edit.place-waypoint-on-route",
    location: shapePointFactory.build(),
  })
  machine.send({ type: "detour.edit.done" })

  const snapshot = machine.getPersistedSnapshot()
  machine.stop()

  return {
    updatedAt: 1724866392,
    author: "fake@email.com",
    state: snapshot,
  }
})
