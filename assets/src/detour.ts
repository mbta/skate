import { LatLngLiteral } from "leaflet"
import { Shape, ShapePoint } from "./schedule"

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
  shape: Shape
  center: LatLngLiteral
  zoom: number
}
