import { DirectionId, TimepointId } from "../schedule"

export enum LadderDirection {
  ZeroToOne,
  OneToZero,
}

export const defaultLadderDirection: LadderDirection = LadderDirection.ZeroToOne

export const flipLadderDirection = (
  ladderDirection: LadderDirection
): LadderDirection =>
  ladderDirection === LadderDirection.ZeroToOne
    ? LadderDirection.OneToZero
    : LadderDirection.ZeroToOne

export const orderTimepoints = (
  timepointsFromApi: TimepointId[],
  ladderDirection: LadderDirection
): TimepointId[] =>
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
