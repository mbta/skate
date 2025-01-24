import { Factory } from "fishery"
import { createActor } from "xstate"
import { createDetourMachine } from "../../src/models/createDetourMachine"
import { originalRouteFactory } from "./originalRouteFactory"
import { shapePointFactory } from "./shapePointFactory"
import { DetourWithState } from "../../src/models/detour"

export const detourInProgressFactory = Factory.define<DetourWithState>(() => {
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

interface DetourWithStateTransientParams {
  duration: string
}

export const activeDetourFactory = Factory.define<
  DetourWithState,
  DetourWithStateTransientParams
>(({ transientParams }) => {
  // Activated detour machine
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
  machine.send({ type: "detour.share.open-activate-modal" })
  machine.send({
    type: "detour.share.activate-modal.select-duration",
    duration: transientParams.duration ? transientParams.duration : "2 hours",
  })
  machine.send({ type: "detour.share.activate-modal.next" })
  machine.send({
    type: "detour.share.activate-modal.select-reason",
    reason: "Emergency",
  })
  machine.send({ type: "detour.share.activate-modal.next" })
  machine.send({ type: "detour.share.activate-modal.activate" })

  const snapshot = machine.getPersistedSnapshot()
  machine.stop()

  return {
    updatedAt: 1724866392,
    author: "fake@email.com",
    state: snapshot,
  }
})

export const draftDetourFactory = Factory.define<DetourWithState>(() => {
  // Stub out a detour machine, and generate a draft detour
  const machine = createActor(createDetourMachine, {
    input: originalRouteFactory.build(),
  }).start()
  machine.send({
    type: "detour.edit.place-waypoint-on-route",
    location: shapePointFactory.build(),
  })
  machine.send({ type: "detour.save.begin-save" })
  machine.send({ type: "detour.save.set-uuid", uuid: 123 })
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
