import {
  BlockId,
  DirectionId,
  RouteId,
  StopId,
  TimepointId,
  TripId,
  ViaVariant,
} from "./schedule.d"

import { HeadwaySpacing } from "./models/vehicleStatus"

export interface BlockWaiver {
  startTime: Date
  endTime: Date
  causeId: number
  causeDescription: string
  remark: string | null
}

export type OccupancyStatus =
  | "NO_DATA"
  | "EMPTY"
  | "MANY_SEATS_AVAILABLE"
  | "FEW_SEATS_AVAILABLE"
  | "FULL"

export interface Crowding {
  load: number | null
  capacity: number | null
  occupancyStatus: OccupancyStatus | null
  occupancyPercentage: number | null
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
  tripId: TripId
  headsign: string
  blockId: BlockId
  runId: RunId | null
  viaVariant: ViaVariant | null
  layoverDepartureTime: number | null
  scheduledTimepointStatus: VehicleTimepointStatus | null
  routeStatus: RouteStatus
  blockWaivers: BlockWaiver[]
}

export type SourceId = string

export type RouteStatus = "on_route" | "laying_over" | "pulling_out"

export type RunId = string

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
  tripId: TripId | null
  headsign: string | null
  viaVariant: ViaVariant | null
  operatorId: string
  operatorName: string
  operatorLogonTime: Date | null
  bearing: number
  blockId: BlockId
  headwaySecs: number | null
  headwaySpacing: HeadwaySpacing | null
  previousVehicleId: string
  scheduleAdherenceSecs: number
  scheduledHeadwaySecs: number
  isShuttle: boolean
  isOverload: boolean
  isOffCourse: boolean
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
