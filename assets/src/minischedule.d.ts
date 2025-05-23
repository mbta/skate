import { RunId } from "./realtime"
import {
  BlockId,
  DirectionId,
  RouteId,
  StopId,
  TimepointId,
  TimepointNameById,
  TripId,
  ViaVariant,
} from "./schedule"

export type Activity = Break | Piece

export interface Run {
  id: RunId
  activities: Activity[]
}

export interface Block {
  id: BlockId
  pieces: Piece[]
}

export interface ScheduleRun {
  run: Run
  timepoints: TimepointNameById
}

export interface ScheduleBlock {
  block: Block
  timepoints: TimepointNameById
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
  stopTimes: StopTime[]
}

export interface StopTime {
  time: Time
  stopId: StopId
  timepointId: TimepointId | null
}

export type Time = number
