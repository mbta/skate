import { Factory } from "fishery"
import { Piece } from "../../src/minischedule"
import { TripFactory } from "./trip"
/*
const midRouteSwingWithNonRevFirst: Piece = {
  runId: "run2",
  blockId: "block",
  startTime: 120,
  startPlace: "swingplace",
  trips: [
    {
      ...midRouteSwingTrip2,
      routeId: null,
      startPlace: "DH start location",
      endPlace: "DH end location",
    },
    {
      ...midRouteSwingTrip2,
      startTime: midRouteSwingTrip2.endTime + 60,
      endTime: midRouteSwingTrip2.endTime + 120,
    },
  ],
  endTime: 480,
  endPlace: "terminal1",
  startMidRoute: {
    time: 180,
    trip: midRouteSwingTrip1,
  },
  endMidRoute: false,
}
 */
export default Factory.define<Piece>(({ sequence }) => {
  const numTrips = 10
  const duration = 10
  let piece = {
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

  // const firstTrip = piece.trips[0]
  // const lastTrip = piece.trips[-1]
  // const [firstTrip, ..., lastTrip] = piece.trips
  // piece = {
  //   ...piece,
  //   startTime: firstTrip.startTime,
  //   startPlace: firstTrip.startPlace,
  //   endPlace: lastTrip.endPlace,
  //   endTime: lastTrip.endTime,
  // }

  return piece
})

// const piece: Piece = {
//   runId: "run",
//   blockId: "block",
//   startTime: 1820,
//   startPlace: "start",
//   trips: [revenueTrip],
//   endTime: 1821,
//   endPlace: "end",
//   startMidRoute: null,
//   endMidRoute: false,
// }
