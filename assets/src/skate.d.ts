export interface Route {
  id: RouteId
}

export type RouteId = string

export interface Timepoint {
  id: TimepointId
}

// An undefined value indicates that the timepoints need to be loaded
// A null value indicates that we are currently loading the timepoints
export type LoadableTimepoints = Timepoint[] | null | undefined

export type TimepointId = string

export interface TimepointsByRouteId {
  [routeId: string]: LoadableTimepoints
}
