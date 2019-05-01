export interface ByRouteId<T> {
  [routeId: string]: T
}

export type Direction = 0 | 1

export interface Route {
  id: RouteId
}

export type RouteId = string

export type StopId = string

// An undefined value indicates that the timepointIds need to be loaded
// A null value indicates that we are currently loading the timepointIds
export type LoadableTimepoints = TimepointId[] | null | undefined

export type TimepointId = string

export type TimepointsByRouteId = ByRouteId<LoadableTimepoints>

export type TripId = string

export interface Vehicle {
  id: VehicleId
  label: string
  timestamp: number
  direction_id: Direction
  route_id: RouteId
  trip_id: TripId
  current_status: VehicleStatus
  stop_id: StopId
}

export type VehicleId = string

export type VehiclesByRouteId = ByRouteId<Vehicle[]>

export type VehicleStatus = "in_transit_to" | "stopped_at"
