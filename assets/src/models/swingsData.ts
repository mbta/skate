import { Infer, number, type, string } from "superstruct"
import { Swing } from "../schedule"

export const SwingData = type({
  block_id: string(),
  from_route_id: string(),
  from_run_id: string(),
  from_trip_id: string(),
  to_route_id: string(),
  to_run_id: string(),
  to_trip_id: string(),
  time: number(),
})
export type SwingData = Infer<typeof SwingData>

export const swingsFromData = (swingsData: SwingData[]): Swing[] =>
  swingsData.map((swingData) => ({
    blockId: swingData.block_id,
    fromRouteId: swingData.from_route_id,
    fromRunId: swingData.from_run_id,
    fromTripId: swingData.from_trip_id,
    toRouteId: swingData.to_route_id,
    toRunId: swingData.to_run_id,
    toTripId: swingData.to_trip_id,
    time: swingData.time,
  }))
