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
  id: string
  directionId: DirectionId
  routeId: RouteId
  tripId: TripId
  blockId: BlockId
  viaVariant: ViaVariant | null
  scheduledTimepointStatus: VehicleTimepointStatus
}

export type SourceId = string

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
  speed: number | null
  blockId: BlockId
  headwaySecs: number | null
  headwaySpacing: HeadwaySpacing | null
  previousVehicleId: string
  scheduleAdherenceSecs: number
  scheduleAdherenceString: string
  scheduledHeadwaySecs: number
  isOffCourse: boolean
  isLayingOver: boolean
  layoverDepartureTime: number | null
  blockIsActive: boolean
  dataDiscrepancies: DataDiscrepancy[]
  stopStatus: VehicleStopStatus
  timepointStatus: VehicleTimepointStatus | null
  scheduledLocation: VehicleScheduledLocation | null
  isOnRoute: boolean
}

export type VehicleId = string

export interface VehicleStopStatus {
  status: VehicleStatus
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

export type VehicleStatus = "in_transit_to" | "stopped_at"

export interface VehiclesForRoute {
  onRouteVehicles: Vehicle[]
  incomingVehicles: Vehicle[]
  ghosts: Ghost[]
}
