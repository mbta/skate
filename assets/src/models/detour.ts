import { LatLngLiteral } from "leaflet"
import { ShapePoint, Stop } from "../schedule"
import { CreateDetourMachineInput } from "./createDetourMachine"
import { array, Infer, nullable, number, string, type } from "superstruct"

export const SimpleDetour = type({
  route: string(),
  direction: string(),
  name: string(),
  intersection: string(),
  updated_at: number(),
})

export type SimpleDetour = Infer<typeof SimpleDetour>

export const GroupedSimpleDetours = type({
  active: nullable(array(SimpleDetour)),
  draft: nullable(array(SimpleDetour)),
  past: nullable(array(SimpleDetour)),
})

export type GroupedSimpleDetours = Infer<typeof GroupedSimpleDetours>

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
