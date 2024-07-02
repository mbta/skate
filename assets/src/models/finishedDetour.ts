import { array, Infer, nullable, number, type } from "superstruct"
import { FinishedDetour } from "./detour"
import { StopData, stopFromData, stopsFromData } from "./stopData"
import { DetourShapeData } from "./detourShapeData"

const Coordinate = type({
  lat: number(),
  lon: number(),
})

export const FinishedDetourData = type({
  missed_stops: array(StopData),
  connection_stop_start: nullable(StopData),
  connection_stop_end: nullable(StopData),
  route_segments: type({
    before_detour: array(Coordinate),
    detour: array(Coordinate),
    after_detour: array(Coordinate),
  }),
  detour_shape: DetourShapeData,
})
export type FinishedDetourData = Infer<typeof FinishedDetourData>

export const finishedDetourFromData = (
  finishedDetour: FinishedDetourData
): FinishedDetour => {
  return {
    missedStops: stopsFromData(finishedDetour.missed_stops),
    connectionPoint: {
      start: finishedDetour.connection_stop_start
        ? stopFromData(finishedDetour.connection_stop_start)
        : undefined,
      end: finishedDetour.connection_stop_end
        ? stopFromData(finishedDetour.connection_stop_end)
        : undefined,
    },
    routeSegments: {
      beforeDetour: finishedDetour.route_segments.before_detour,
      detour: finishedDetour.route_segments.detour,
      afterDetour: finishedDetour.route_segments.after_detour,
    },
    detourShape: finishedDetour.detour_shape,
  }
}
