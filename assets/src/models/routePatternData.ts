import { define, Infer, nullable, number, string, type } from "superstruct"
import { RoutePattern } from "../schedule"
import { ShapeData, shapeFromData } from "./shapeData"

const DirectionId = define<0 | 1>(
  "DirectionId",
  (value) => value === 1 || value === 0
)

export const RoutePatternData = type({
  id: string(),
  name: string(),
  route_id: string(),
  direction_id: DirectionId,
  time_desc: nullable(string()),
  sort_order: number(),
  shape: nullable(ShapeData),
  headsign: nullable(string()),
})

export type RoutePatternData = Infer<typeof RoutePatternData>

export const routePatternFromData = (
  routePatternData: RoutePatternData
): RoutePattern => ({
  id: routePatternData.id,
  name: routePatternData.name,
  routeId: routePatternData.route_id,
  directionId: routePatternData.direction_id,
  timeDescription: routePatternData.time_desc,
  sortOrder: routePatternData.sort_order,
  shape: routePatternData.shape
    ? shapeFromData(routePatternData.shape)
    : routePatternData.shape,
  headsign: routePatternData.headsign,
})

export const routePatternsFromData = (
  routePatternsData: RoutePatternData[]
): RoutePattern[] => {
  return routePatternsData.map(routePatternFromData)
}
