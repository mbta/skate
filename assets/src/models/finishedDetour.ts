import { array, Infer, number, type } from "superstruct"
import { FinishedDetour } from "./detour"
import { StopData, stopsFromData } from "./stopData"

const Coordinate = type({
  lat: number(),
  lon: number(),
})

export const FinishedDetourData = type({
  missed_stops: array(StopData),
  route_segments: type({
    before_detour: array(Coordinate),
    detour: array(Coordinate),
    after_detour: array(Coordinate),
  }),
})
export type FinishedDetourData = Infer<typeof FinishedDetourData>

export const finishedDetourFromData = (
  finishedDetour: FinishedDetourData
): FinishedDetour => {
  return {
    missedStops: stopsFromData(finishedDetour.missed_stops),
    routeSegments: {
      beforeDetour: finishedDetour.route_segments.before_detour,
      detour: finishedDetour.route_segments.detour,
      afterDetour: finishedDetour.route_segments.after_detour,
    },
  }
}
