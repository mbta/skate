import { RunId } from "../realtime"
import { BlockId, RouteId, Swing, TripId } from "../schedule"

export interface SwingData {
  block_id: BlockId
  from_route_id: RouteId
  from_run_id: RunId
  from_trip_id: TripId
  to_route_id: RouteId
  to_run_id: RunId
  to_trip_id: TripId
  time: number
}

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
