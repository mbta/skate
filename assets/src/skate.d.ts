export interface Route {
  id: RouteId
}

export type RouteId = string

export interface Timepoint {
  id: TimepointId
}

// A null value (as opposed to undefined) indicates that we are currently
// loading the timepoints
export type LoadableTimepoints = Timepoint[] | null

export type TimepointId = string

export interface TimepointsByRouteId {
  [routeId: string]: LoadableTimepoints
}
