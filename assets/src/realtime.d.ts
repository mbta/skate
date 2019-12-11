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

export interface DataDiscrepancy {
  attribute: string
  sources: DataDiscrepancySource[]
}

interface DataDiscrepancySource {
  id: SourceId
  value: string | null
}

export interface Ghost {
  id: VehicleId
  directionId: DirectionId
  routeId: RouteId
  tripId: TripId
  headsign: string
  blockId: BlockId
  runId: RunId | null
  viaVariant: ViaVariant | null
  scheduledTimepointStatus: VehicleTimepointStatus
  routeStatus: RouteStatus
}

export type SourceId = string

export type RouteStatus = "on_route" | "laying_over" | "pulling_out"

export type RunId = string

export interface Vehicle {
  id: VehicleId
  label: string
  runId: RunId | null
  timestamp: number
  latitude: number
  longitude: number
  directionId: DirectionId
  routeId: RouteId
  tripId: TripId
  headsign: string | null
  viaVariant: ViaVariant | null
  operatorId: string
  operatorName: string
  bearing: number
  blockId: BlockId
  headwaySecs: number | null
  headwaySpacing: HeadwaySpacing | null
  previousVehicleId: string
  scheduleAdherenceSecs: number
  scheduledHeadwaySecs: number
  isOffCourse: boolean
  layoverDepartureTime: number | null
  blockIsActive: boolean
  dataDiscrepancies: DataDiscrepancy[]
  stopStatus: VehicleStopStatus
  timepointStatus: VehicleTimepointStatus | null
  scheduledLocation: VehicleScheduledLocation | null
  routeStatus: RouteStatus
}

export type VehicleOrGhost = Vehicle | Ghost

export type VehicleId = string

export interface VehicleStopStatus {
  stopId: StopId
  stopName: string
}

export interface VehicleScheduledLocation {
  directionId: DirectionId
  timepointStatus: VehicleTimepointStatus
}

export interface VehicleTimepointStatus {
  timepointId: TimepointId
  fractionUntilTimepoint: number
}
