import {
  DirectionId,
  RouteId,
  StopId,
  TimepointId,
  TripId,
  ViaVariant,
} from "./schedule.d"

export interface DataDiscrepancy {
  attribute: string
  sources: DataDiscrepancySource[]
}

interface DataDiscrepancySource {
  id: SourceId
  value: string | null
}

export type HeadwaySpacing =
  | "very_bunched"
  | "bunched"
  | "ok"
  | "gapped"
  | "very_gapped"
  | null

export type ScheduleAdherenceStatus = "on-time" | "early" | "late"

export type SourceId = string

export interface Vehicle {
  id: VehicleId
  label: string
  runId: string
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
  speed: number
  blockId: string
  headwaySecs: number | null
  headwaySpacing: HeadwaySpacing
  previousVehicleId: string
  scheduleAdherenceSecs: number
  scheduleAdherenceString: string
  scheduleAdherenceStatus: ScheduleAdherenceStatus
  scheduledHeadwaySecs: number
  isOffCourse: boolean
  blockIsActive: boolean
  dataDiscrepancies: DataDiscrepancy[]
  stopStatus: VehicleStopStatus
  timepointStatus: VehicleTimepointStatus | null
  scheduledLocation: VehicleScheduledLocation | null
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
}
