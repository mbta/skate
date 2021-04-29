import { RunId } from "./realtime"

export type BlockId = string

export type DirectionId = 0 | 1

export type DirectionName = string

export type StopId = string

export interface Stop {
  id: StopId
  name: string
  lat: number
  lon: number
}

export type RouteId = string

export interface ByRouteId<T> {
  [routeId: string]: T
}

export interface Route {
  id: RouteId
  directionNames: {
    0: DirectionName
    1: DirectionName
  }
  name: string
}

export interface Shape {
  id: ShapeId
  color?: string
  points: ShapePoint[]
  stops?: Stop[]
}

export type ShapeId = string

export interface ShapePoint {
  lat: number
  lon: number
}

export type TimepointId = string

export interface Timepoint {
  id: TimepointId
  name: string | null
}

export interface Swing {
  fromRouteId: RouteId
  fromRunId: RunId
  fromTripId: TripId
  toRouteId: RouteId
  toRunId: RunId
  toTripId: TripId
  time: number
}

// An undefined value indicates that the timepoints need to be loaded
// A null value indicates that we are currently loading the timepoints
export type LoadableTimepoints = Timepoint[] | null | undefined

export type TimepointsByRouteId = ByRouteId<LoadableTimepoints>

export type TripId = string

export type ViaVariant = string
