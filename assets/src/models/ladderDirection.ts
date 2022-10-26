import { enums, Infer, record, string } from "superstruct"
import { ByRouteId, DirectionId, RouteId, Timepoint } from "../schedule"

export enum LadderDirection {
  ZeroToOne,
  OneToZero,
}

const defaultLadderDirection: LadderDirection = LadderDirection.ZeroToOne

export type LadderDirections = ByRouteId<LadderDirection>

export const LadderDirectionsData = record(string(), enums([0, 1]))
export type LadderDirectionsData = Infer<typeof LadderDirectionsData>

export const emptyLadderDirectionsByRouteId: LadderDirections = {}

export const getLadderDirectionForRoute = (
  ladderDirections: LadderDirections,
  routeId: RouteId
): LadderDirection => ladderDirections[routeId] || defaultLadderDirection

const flipLadderDirection = (
  ladderDirection: LadderDirection
): LadderDirection =>
  ladderDirection === LadderDirection.ZeroToOne
    ? LadderDirection.OneToZero
    : LadderDirection.ZeroToOne

export const flipLadderDirectionForRoute = (
  ladderDirections: LadderDirections,
  routeId: RouteId
): LadderDirections => {
  const currentLadderDirection = getLadderDirectionForRoute(
    ladderDirections,
    routeId
  )
  return {
    ...ladderDirections,
    [routeId]: flipLadderDirection(currentLadderDirection),
  }
}

export const orderTimepoints = (
  timepointsFromApi: Timepoint[],
  ladderDirection: LadderDirection
): Timepoint[] =>
  // Timepoints come from the API in the ZeroToOne direction
  // Use slice to make a copy of the array before destructively reversing
  ladderDirection === LadderDirection.OneToZero
    ? timepointsFromApi.slice().reverse()
    : timepointsFromApi

export enum VehicleDirection {
  Down,
  Up,
}

export const directionOnLadder = (
  directionId: DirectionId,
  ladderDirection: LadderDirection
): VehicleDirection =>
  (directionId === 1) === (ladderDirection === LadderDirection.ZeroToOne)
    ? VehicleDirection.Down
    : VehicleDirection.Up
