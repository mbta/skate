import { array, Infer, number, type } from "superstruct"
import { UnfinishedDetour } from "./detour"

const Coordinate = type({
  lat: number(),
  lon: number(),
})

export const UnfinishedDetourData = type({
  unfinished_route_segments: type({
    before_start_point: array(Coordinate),
    after_start_point: array(Coordinate),
  }),
})
export type UnfinishedDetourData = Infer<typeof UnfinishedDetourData>

export const unfinishedDetourFromData = (
  unfinishedDetour: UnfinishedDetourData
): UnfinishedDetour => {
  return {
    unfinishedRouteSegments: {
      beforeStartPoint:
        unfinishedDetour.unfinished_route_segments.before_start_point,
      afterStartPoint:
        unfinishedDetour.unfinished_route_segments.after_start_point,
    },
  }
}
