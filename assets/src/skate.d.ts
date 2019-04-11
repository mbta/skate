export interface Route {
  id: RouteId
}

export type RouteId = string

export interface Timepoint {
  id: TimepointId
}

export type TimepointId = string

export interface TimepointsByRouteId {
  [routeId: string]: Timepoint[]
}
