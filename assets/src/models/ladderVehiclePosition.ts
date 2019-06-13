import {
  heightOfVehicleGroup,
  LadderDirection,
  widthOfVehicleGroup,
} from "../components/ladder"
import { Vehicle, VehicleTimepointStatus } from "../skate"

export interface LadderVehiclePosition {
  vehicle: Vehicle
  x: number
  y: number
  vehicleDirection: VehicleDirection
  lane: number
}

export enum VehicleDirection {
  Down,
  Up,
}

interface WithVehicle {
  vehicle: Vehicle
}

interface OnLadder {
  y: number
  vehicleDirection: VehicleDirection
}

interface VehicleOnLadder extends WithVehicle, OnLadder {}

interface InLane extends OnLadder {
  lane: number
}

interface VehicleInLane extends WithVehicle, InLane {}

type YFunc = (
  timepointStatus: VehicleTimepointStatus | null,
  direction: VehicleDirection
) => number | null

export const ladderVehiclePositionsFromVehicles = (
  vehicles: Vehicle[],
  ladderDirection: LadderDirection,
  yFunc: YFunc
): {
  ladderVehiclePositions: LadderVehiclePosition[]
  widthOfLanes: number
} => {
  const vehiclesOnLadder: VehicleOnLadder[] = vehicles.map(vehicle =>
    vehicleOnLadder(vehicle, ladderDirection, yFunc)
  )

  const vehiclesInLane: VehicleInLane[] = putIntoLanes(vehiclesOnLadder)

  const maxOccupiedLane: number = numOccupiedLanes(vehiclesInLane)
  const ladderVehicleHorizontalOffset: number = horizontalOffsetForLanes(
    maxOccupiedLane
  )
  const xInLane = xInLaneWithOffset(ladderVehicleHorizontalOffset)

  const ladderVehiclePositions: LadderVehiclePosition[] = vehiclesInLane.map(
    vehicleInLane => addX(vehicleInLane, xInLane)
  )

  return {
    ladderVehiclePositions,
    widthOfLanes: maxOccupiedLane * ladderVehicleHorizontalOffset,
  }
}

export const vehicleDirectionOnLadder = (
  vehicle: Vehicle,
  ladderDirection: LadderDirection
): VehicleDirection =>
  (vehicle.directionId === 1) ===
  (ladderDirection === LadderDirection.ZeroToOne)
    ? VehicleDirection.Down
    : VehicleDirection.Up

const vehicleOnLadder = (
  vehicle: Vehicle,
  ladderDirection: LadderDirection,
  yFunc: YFunc
): VehicleOnLadder => {
  const vehicleDirection: VehicleDirection = vehicleDirectionOnLadder(
    vehicle,
    ladderDirection
  )

  const y = yFunc(vehicle.timepointStatus, vehicleDirection) || -10

  return {
    vehicle,
    vehicleDirection,
    y,
  }
}

export const putIntoLanes = (
  vehiclesOnLadder: VehicleOnLadder[]
): VehicleInLane[] =>
  vehiclesOnLadder
    .slice()
    .sort(byDirectionAndY)
    .reduce(
      (
        previousLadderVehiclePositions: VehicleInLane[],
        ladderVehiclePosition: VehicleOnLadder
      ): VehicleInLane[] => {
        const overlappers: InLane[] = overlappingPreviousVehicles(
          previousLadderVehiclePositions,
          ladderVehiclePosition
        )
        const occupiedLanes: number[] = overlappers.map(
          overlapper => overlapper.lane
        )
        const lane = firstOpenLane(occupiedLanes)

        return [
          {
            ...ladderVehiclePosition,
            lane,
          },
          ...previousLadderVehiclePositions,
        ]
      },
      []
    )

const numOccupiedLanes = (vehicles: InLane[]): number => {
  const allLanes: number[] = vehicles.map(({ lane }) => lane || 0)
  const furthestLane = allLanes.length ? Math.max(...allLanes) : 0
  return furthestLane + 1
}

const horizontalOffsetForLanes = (maxOccupiedLane: number): number => {
  const cappedLanes = Math.min(maxOccupiedLane, 5)
  return ((8 - cappedLanes) / 8) * widthOfVehicleGroup
}

const xInLaneWithOffset = (ladderVehicleHorizontalOffset: number) => (
  { vehicleDirection, lane }: InLane,
  baseX: number
): number => {
  const laneOffset = (lane || 0) * ladderVehicleHorizontalOffset
  return vehicleDirection === VehicleDirection.Up
    ? baseX + laneOffset
    : baseX - laneOffset
}

const addX = (
  vehicleInLane: VehicleInLane,
  xInLane: (vehicle: InLane, baseX: number) => number
): LadderVehiclePosition => {
  const baseX =
    vehicleInLane.vehicleDirection === VehicleDirection.Up ? 63 : -63

  const x = xInLane(vehicleInLane, baseX)

  return {
    ...vehicleInLane,
    x,
  }
}

/**
 * Sort vehicles based on which direction they are traveling,
 * and given that direction, which vehicle is following the other.
 * E.g. traveling Down a smaller Y means you are behind.
 *
 * Sort order is only important for the internal logic of putIntoLanes.
 */
export const byDirectionAndY = (a: OnLadder, b: OnLadder): number => {
  if (a.vehicleDirection === VehicleDirection.Down) {
    if (b.vehicleDirection === VehicleDirection.Up) {
      return -1
    } else {
      if (a.y > b.y) {
        return -1
      } else if (b.y > a.y) {
        return 1
      } else {
        return 0
      }
    }
  } else {
    if (b.vehicleDirection === VehicleDirection.Down) {
      return 1
    } else {
      if (a.y < b.y) {
        return -1
      } else if (b.y < a.y) {
        return 1
      } else {
        return 0
      }
    }
  }
}

const overlappingPreviousVehicles = (
  previousVehicles: InLane[],
  vehicle: OnLadder
): InLane[] =>
  previousVehicles.filter(previousVehicle =>
    areOverlapping(previousVehicle, vehicle)
  )

export const areOverlapping = (a: OnLadder, b: OnLadder): boolean =>
  a.vehicleDirection === b.vehicleDirection &&
  Math.abs(a.y - b.y) < heightOfVehicleGroup

export const firstOpenLane = (occupiedLanes: number[]): number => {
  const sortedOccupiedLanes = occupiedLanes.slice().sort()

  for (let index = 0; index < sortedOccupiedLanes.length; index++) {
    if (sortedOccupiedLanes[index] !== index) {
      return index
    }
  }

  return sortedOccupiedLanes.length
}
