import { LatLngLiteral } from "leaflet"
import { ShapePoint, Stop } from "../schedule"
import { CreateDetourMachineInput } from "./createDetourMachine"
import { any, Infer, number, string, type } from "superstruct"

export interface DetourWithState {
  author: string
  state: any
  updatedAt: number
}

export const DetourWithStateData = type({
  author: string(),
  state: any(),
  updated_at: number(),
})

export type DetourWithStateData = Infer<typeof DetourWithStateData>

export const detourStateFromData = (
  detourWithState: DetourWithStateData
): DetourWithState => ({
  author: detourWithState.author,
  state: detourWithState.state,
  updatedAt: detourWithState.updated_at,
})

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
