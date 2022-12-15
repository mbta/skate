import { Factory } from "fishery"
import { Piece } from "../../src/minischedule"
import { TripFactory } from "./trip"

export default Factory.define<Piece>(({ sequence }) => {
  const numTrips = 10
  const duration = 10
  const piece = {
    runId: `run-id-${sequence}`,
    blockId: "block-id",

    trips: TripFactory.buildList(numTrips),

    startMidRoute: null,
    endMidRoute: false,

    startTime: sequence * duration,
    endTime: (sequence + 1) * duration,

    startPlace: `start-place-${sequence}`,
    endPlace: `end-place-${sequence}`,
  }

  return piece
})
