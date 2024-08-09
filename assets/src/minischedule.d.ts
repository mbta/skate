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
  id: TripId | null
  kind: "wad" | "rad"
  startTime: Time
  endTime: Time
}

export interface Piece {
  runId: RunId
  blockId: BlockId | null
  startTime: Time
  startPlace: string
  trips: (Trip | AsDirected)[]
  endTime: Time
  endPlace: string
  startMidRoute: {
    time: Time
    trip: Trip
  } | null
  endMidRoute: boolean
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
