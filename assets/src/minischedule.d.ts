import { RunId } from "./realtime"
import { BlockId, DirectionId, RouteId, TripId, ViaVariant } from "./schedule"

export type Activity = Break | Piece

export interface Run {
  id: RunId
  activities: Activity[]
}

export interface Block {
  id: BlockId
  pieces: Piece[]
}

export interface Break {
  breakType: string
  startTime: Time
  endTime: Time
  endPlace: string
}

export interface AsDirected {
  kind: "wad" | "rad"
  startTime: Time
  endTime: Time
}

export interface Piece {
  runId: RunId
  blockId: BlockId | null
  start: SignOnOff
  trips: (Trip | AsDirected)[]
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
  routeId: RouteId | null
  headsign: string | null
  directionId: DirectionId | null
  viaVariant: ViaVariant | null
  runId: RunId | null
  startTime: Time
  endTime: Time
  startPlace: string
  endPlace: string
}

export type Time = number
