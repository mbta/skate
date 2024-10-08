import {
  BlockId,
  DirectionId,
  RouteId,
  RoutePatternId,
  StopId,
  TimepointId,
  TripId,
  ViaVariant,
} from "./schedule"

import { Crowding } from "./models/crowding"
import { DetourId } from "./models/detoursList"

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

export interface DataDiscrepancySource {
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

// A Notification's `content` is populated with an Elixir struct and the
// `__struct__` field is serialized so that the type can be discerned on the
// frontend.
export enum NotificationType {
  BridgeMovement = "Elixir.Notifications.Db.BridgeMovement",
  BlockWaiver = "Elixir.Notifications.Db.BlockWaiver",
  Detour = "Elixir.Notifications.Db.Detour",
}

export interface BridgeLoweredNotification {
  $type: NotificationType.BridgeMovement
  status: "lowered"
}

export interface BridgeRaisedNotification {
  $type: NotificationType.BridgeMovement
  status: "raised"
  loweringTime: Date
}

export type BridgeNotification =
  | BridgeLoweredNotification
  | BridgeRaisedNotification

export type BlockWaiverNotification = {
  $type: NotificationType.BlockWaiver
  createdAt: Date
  reason: BlockWaiverReason
  routeIds: RouteId[]
  runIds: RunId[]
  tripIds: TripId[]
  operatorId: string | null
  operatorName: string | null
  routeIdAtCreation: string | null
  startTime: Date
  endTime: Date | null
}

export enum DetourNotificationStatus {
  Activated = "activated",
  Deactivated = "deactivated",
}

export type DetourNotification = {
  $type: NotificationType.Detour
  status: DetourNotificationStatus
  detourId: DetourId
  headsign: string
  route: string
  direction: string
  origin: string
}

export type NotificationContentTypes =
  | BridgeNotification
  | BlockWaiverNotification
  | DetourNotification

export interface Notification<
  TNotification extends NotificationContentTypes = NotificationContentTypes
> {
  id: NotificationId
  createdAt: Date
  state: NotificationState
  content: TNotification
}

export function isBlockWaiverNotification(
  notification: Notification
): notification is Notification<BlockWaiverNotification> {
  return notification.content.$type === NotificationType.BlockWaiver
}
export type BlockWaiverReason =
  | "other"
  | "accident"
  | "adjusted"
  | "disabled"
  | "diverted"
  | "manpower"
  | "operator_error"
  | "traffic"

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
  label: string | null
  runId: RunId | null
  timestamp: number
  latitude: number
  longitude: number
  directionId: DirectionId | null
  routeId: RouteId | null
  routePatternId: RoutePatternId | null
  tripId: TripId | null
  headsign: string | null
  viaVariant: ViaVariant | null
  operatorId: string | null
  operatorFirstName: string | null
  operatorLastName: string | null
  operatorLogonTime: Date | null
  overloadOffset?: number
  bearing?: number
  blockId: BlockId | null
  previousVehicleId: string | null
  scheduleAdherenceSecs: number | null
  incomingTripDirectionId: DirectionId | null
  isShuttle: boolean
  isOverload: boolean
  isOffCourse: boolean
  isRevenue: boolean | null
  layoverDepartureTime: number | null
  pullbackPlaceName: string | null
  dataDiscrepancies: DataDiscrepancy[]
  stopStatus: VehicleStopStatus
  timepointStatus: VehicleTimepointStatus | null
  scheduledLocation: VehicleScheduledLocation | null
  routeStatus: RouteStatus
  endOfTripType: EndOfTripType
  blockWaivers: BlockWaiver[]
  crowding: Crowding | null
}

export interface VehicleInScheduledService extends Vehicle {
  directionId: DirectionId
  routeId: RouteId
  blockId: BlockId
}

export type VehicleId = string

export interface VehicleStopStatus {
  stopId: StopId | null
  stopName: string | null
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
