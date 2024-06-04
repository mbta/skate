import { LatLngLiteral } from "leaflet"
import { Route, RoutePattern, RoutePatternId, Shape, ShapePoint, Stop } from "../schedule"

export interface DetourShape {
  coordinates: ShapePoint[]
  directions?: DetourDirection[]
}

export type DetourDirection = {
  instruction: string
}

export interface OriginalRoute {
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
  routePatternId: RoutePatternId
  shape: Shape
  route: Route
  routePattern: RoutePattern
  center: LatLngLiteral
  zoom: number
}

export interface RouteSegments {
  beforeDetour: ShapePoint[]
  detour: ShapePoint[]
  afterDetour: ShapePoint[]
}

export interface FinishedDetour {
  missedStops: Stop[]
  connectionPoint: {
    start?: Stop
    end?: Stop
  }
  routeSegments: RouteSegments
}
