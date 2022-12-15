import { Factory } from "fishery";
import { Piece } from "../../src/minischedule";
import trip from "./trip";
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
  let piece = {
    runId: `run-id-${sequence}`,
    blockId: "block-id",
    trips: [
      trip.build()
    ],
    startMidRoute: null,
    endMidRoute: false,

    startTime: 1,
    startPlace: `start-place-${sequence}`,
    endTime: 10,
    endPlace: `end-place-${sequence}`,
  };

  piece = {
    ...piece,
    startTime: piece.trips[0].startTime,
    startPlace: piece.trips[0].startPlace,
    endPlace: piece.trips[0].endPlace,
    endTime: piece.trips[-1].endTime,
  }

  return piece
});

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
