import { RunId } from "./realtime"
import { BlockId, DirectionId, RouteId, TripId } from "./schedule"

export interface Run {
  id: RunId
  activities: (Break | Piece)[]
}

export interface Block {
  id: BlockId
  pieces: Piece[]
}

export interface Break {
  breakType: String
  startTime: Time
  endTime: Time
}

export interface Piece {
  runId: RunId
  blockId: BlockId
  start: SignOnOff
  trips: Trip[]
  end: SignOnOff
}

export interface SignOnOff {
  time: Time
  place: string
  midRoute: boolean
}

export interface Trip {
  id: TripId
  blockId: BlockId
  routeId: RouteId
  headsign: string | null
  directionId: DirectionId | null
  runId: RunId | null
  startTime: Time
  endTime: Time
}

export type Time = number
