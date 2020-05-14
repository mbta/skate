import {
  Block,
  Break,
  Piece,
  Run,
  SignOnOff,
  Time,
  Trip,
} from "../minischedule"
import { RunId } from "../realtime"
import { BlockId, DirectionId, RouteId, TripId, ViaVariant } from "../schedule"

interface RunData {
  id: RunId
  activities: (BreakData | PieceData)[]
}

interface BlockData {
  id: BlockId
  pieces: PieceData[]
}

interface BreakData {
  break_type: string
  start_time: Time
  end_time: Time
}

interface PieceData {
  run_id: RunId
  block_id: BlockId
  start: SignOnOffData
  trips: TripData[]
  end: SignOnOffData
}

interface SignOnOffData {
  time: Time
  place: string
  "mid_route?": boolean
}

interface TripData {
  id: TripId
  block_id: BlockId
  route_id: RouteId
  headsign: string | null
  direction_id: DirectionId | null
  via_variant: ViaVariant | null
  run_id: RunId | null
  start_time: Time
  end_time: Time
}

const isBreakData = (
  activityData: BreakData | PieceData
): activityData is BreakData => activityData.hasOwnProperty("break_type")

export const runFromData = (runData: RunData): Run => ({
  id: runData.id,
  activities: runData.activities.map((activityData) =>
    isBreakData(activityData)
      ? breakFromData(activityData)
      : pieceFromData(activityData)
  ),
})

export const blockFromData = (blockData: BlockData): Block => ({
  id: blockData.id,
  pieces: blockData.pieces.map(pieceFromData),
})

const breakFromData = (breakData: BreakData): Break => ({
  breakType: breakData.break_type,
  startTime: breakData.start_time,
  endTime: breakData.end_time,
})

const pieceFromData = (pieceData: PieceData): Piece => ({
  runId: pieceData.run_id,
  blockId: pieceData.block_id,
  start: signOnOffFromData(pieceData.start),
  trips: pieceData.trips.map(tripFromData),
  end: signOnOffFromData(pieceData.end),
})

const signOnOffFromData = (signOnOffData: SignOnOffData): SignOnOff => ({
  time: signOnOffData.time,
  place: signOnOffData.place,
  midRoute: signOnOffData["mid_route?"],
})

const tripFromData = (tripData: TripData): Trip => ({
  id: tripData.id,
  blockId: tripData.block_id,
  routeId: tripData.route_id,
  headsign: tripData.headsign,
  directionId: tripData.direction_id,
  viaVariant: tripData.via_variant,
  runId: tripData.run_id,
  startTime: tripData.start_time,
  endTime: tripData.end_time,
})
