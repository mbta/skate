export interface ByRouteId<T> {
  [routeId: string]: T
}

export interface DataDiscrepancy {
  attribute: string
  sources: DataDiscrepancySource[]
}

interface DataDiscrepancySource {
  id: SourceId
  value: string | null
}

export type DirectionId = 0 | 1
export type DirectionName = string

export type HeadwaySpacing =
  | "very_bunched"
  | "bunched"
  | "ok"
  | "gapped"
  | "very_gapped"
  | null

export interface Route {
  id: RouteId
  directionNames: {
    0: DirectionName
    1: DirectionName
  }
}

export type RouteId = string

export type ScheduleAdherenceStatus = "on-time" | "early" | "late"

export type StopId = string

export interface Timepoint {
  id: TimepointId
}

// An undefined value indicates that the timepoints need to be loaded
// A null value indicates that we are currently loading the timepoints
export type LoadableTimepoints = Timepoint[] | null | undefined

export type SourceId = string

export type TimepointId = string

export type TimepointsByRouteId = ByRouteId<LoadableTimepoints>

export type TripId = string

export type UserToken = string

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
  dataDiscrepancies: DataDiscrepancy[]
  stopStatus: VehicleStopStatus
  timepointStatus: VehicleTimepointStatus | null
  scheduledLocation: VehicleScheduledLocation | null
  routeStatus: VehicleRouteStatus
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

export type VehiclesByRouteId = ByRouteId<Vehicle[]>

export type VehicleRouteStatus = "incoming" | "on_route"

export type VehicleStatus = "in_transit_to" | "stopped_at"

export type ViaVariant = string
