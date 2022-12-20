import { Factory } from "fishery"
import { Trip } from "../../src/minischedule"

export const TripFactory = Factory.define<Trip>(({ sequence }) => {
  const duration = 10
  return {
    id: `trip-${sequence}`,
    blockId: "block-id",
    routeId: "route-id",
    headsign: "headsign-Revenue",
    directionId: 1,
    viaVariant: null,
    runId: "run-id",
    startTime: sequence * duration,
    endTime: (sequence + 1) * duration,
    startPlace: "trip-start-place",
    endPlace: "trip-end-place",
  }
})

export const DeadheadTripFactory = TripFactory.params({ routeId: null })
