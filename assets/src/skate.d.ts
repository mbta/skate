import { directive } from "@babel/types"

export interface ByRouteId<T> {
  [routeId: string]: T
}

export type DirectionId = 0 | 1
export type DirectionName = string

export interface Route {
  id: RouteId
  directionNames: {
    0: DirectionName
    1: DirectionName
  }
}

export type RouteId = string

export type StopId = string

export interface Timepoint {
  id: TimepointId
}

// An undefined value indicates that the timepoints need to be loaded
// A null value indicates that we are currently loading the timepoints
export type LoadableTimepoints = Timepoint[] | null | undefined

export type TimepointId = string

export type TimepointsByRouteId = ByRouteId<LoadableTimepoints>

export type TripId = string

export interface Vehicle {
  id: VehicleId
  label: string
  run_id: string
  timestamp: number
  latitude: number
  longitude: number
  direction_id: DirectionId
  route_id: RouteId
  trip_id: TripId
  headsign: string | null
  via_variant: ViaVariant | null
  operator_id: string
  operator_name: string
  stop_status: VehicleStopStatus
  timepoint_status: VehicleTimepointStatus | null
  route_status: VehicleRouteStatus
}

export type VehicleId = string

export interface VehicleStopStatus {
  status: VehicleStatus
  stop_id: StopId
  stop_name: string
}

export interface VehicleTimepointStatus {
  timepoint_id: TimepointId
  fraction_until_timepoint: number
}

export type VehiclesByRouteId = ByRouteId<Vehicle[]>

export type VehicleRouteStatus = "incoming" | "on_route"

export type VehicleStatus = "in_transit_to" | "stopped_at"

export type ViaVariant = string
