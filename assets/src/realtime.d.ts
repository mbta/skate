import {
  BlockId,
  DirectionId,
  RouteId,
  RoutePatternId,
  StopId,
  TimepointId,
  TripId,
  ViaVariant,
} from "./schedule.d"

import { Crowding } from "./models/crowding"

export interface BlockWaiver {
  startTime: Date
  endTime: Date
  causeId: number
  causeDescription: string
  remark: string | null
}

export interface DataDiscrepancy {
  attribute: string
  sources: DataDiscrepancySource[]
}

interface DataDiscrepancySource {
  id: SourceId
  value: string | null
}

export type EndOfTripType = "another_trip" | "swing_off" | "pull_back"

export interface Ghost {
  id: VehicleId
  directionId: DirectionId
  routeId: RouteId
  routePatternId: RoutePatternId | null
  tripId: TripId
  headsign: string
  blockId: BlockId
  runId: RunId | null
  viaVariant: ViaVariant | null
  incomingTripDirectionId: DirectionId | null
  layoverDepartureTime: number | null
  scheduledTimepointStatus: VehicleTimepointStatus | null
  scheduledLogonTime: number | null
  routeStatus: RouteStatus
  blockWaivers: BlockWaiver[]
  currentPieceStartPlace: string | null
  currentPieceFirstRoute: RouteId | null
}

export type NotificationId = string

export interface Notification {
  id: NotificationId
  createdAt: Date
  reason: NotificationReason
  routeIds: RouteId[]
  runIds: RunId[]
  tripIds: TripId[]
  operatorName: string | null
  operatorId: string | null
  routeIdAtCreation: string | null
  startTime: Date
  endTime: Date | null
  state: NotificationState
}

export type NotificationReason =
  | "manpower"
  | "disabled"
  | "diverted"
  | "accident"
  | "other"
  | "adjusted"
  | "operator_error"
  | "traffic"
  | "chelsea_st_bridge_raised"
  | "chelsea_st_bridge_lowered"

export type NotificationState = "unread" | "read" | "deleted"

export type SourceId = string

export type RouteStatus = "on_route" | "laying_over" | "pulling_out"

export type RunId = string

export interface ByRunId<T> {
  [runId: string]: T
}

export type TrainVehicleId = string

export interface TrainVehicle {
  id: TrainVehicleId
  latitude: number
  longitude: number
  bearing: number
}

export interface Vehicle {
  id: VehicleId
  label: string
  runId: RunId | null
  timestamp: number
  latitude: number
  longitude: number
  directionId: DirectionId
  routeId: RouteId | null
  routePatternId: RoutePatternId | null
  tripId: TripId | null
  headsign: string | null
  viaVariant: ViaVariant | null
  operatorId: string
  operatorFirstName: string
  operatorLastName: string
  operatorLogonTime: Date | null
  overloadOffset?: number
  bearing: number
  blockId: BlockId
  previousVehicleId: string
  scheduleAdherenceSecs: number
  incomingTripDirectionId: DirectionId | null
  isShuttle: boolean
  isOverload: boolean
  isOffCourse: boolean
  isRevenue: boolean
  layoverDepartureTime: number | null
  dataDiscrepancies: DataDiscrepancy[]
  stopStatus: VehicleStopStatus
  timepointStatus: VehicleTimepointStatus | null
  scheduledLocation: VehicleScheduledLocation | null
  routeStatus: RouteStatus
  endOfTripType: EndOfTripType
  blockWaivers: BlockWaiver[]
  crowding: Crowding | null
}

export type VehicleOrGhost = Vehicle | Ghost

export type VehicleId = string

export interface VehicleStopStatus {
  stopId: StopId
  stopName: string
}

export interface VehicleScheduledLocation {
  routeId: RouteId
  routePatternId: RoutePatternId | null
  directionId: DirectionId
  tripId: TripId
  runId: RunId
  timeSinceTripStartTime: number
  headsign: string | null
  viaVariant: ViaVariant | null
  timepointStatus: VehicleTimepointStatus
}

export interface VehicleTimepointStatus {
  timepointId: TimepointId
  fractionUntilTimepoint: number
}
