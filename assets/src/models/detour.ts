import { LatLngLiteral } from "leaflet"
import { RoutePatternId, Shape, ShapePoint } from "../schedule"

export interface DetourShape {
  coordinates: ShapePoint[]
  directions: {
    instruction: string
  }[]
}

export interface OriginalRoute {
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
  routePatternId: RoutePatternId
  shape: Shape
  center: LatLngLiteral
  zoom: number
}
