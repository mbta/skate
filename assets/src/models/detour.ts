import { LatLngLiteral } from "leaflet"
import { ShapePoint, Stop } from "../schedule"
import { CreateDetourMachineInput } from "./createDetourMachine"

export interface DetourShape {
  coordinates: ShapePoint[]
  directions?: DetourDirection[]
}

export type DetourDirection = {
  instruction: string
}

export interface MapLocation {
  center?: LatLngLiteral
  zoom?: number
}

export type OriginalRoute = CreateDetourMachineInput & MapLocation

export interface UnfinishedRouteSegments {
  beforeStartPoint: ShapePoint[]
  afterStartPoint: ShapePoint[]
}

export interface UnfinishedDetour {
  unfinishedRouteSegments: UnfinishedRouteSegments
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
  detourShape: DetourShape
}
