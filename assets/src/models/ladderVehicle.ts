import { LadderDirection, TimepointStatusYFunc } from "../components/ladder"
import featureIsEnabled from "../laboratoryFeatures"
import { Ghost, Vehicle, VehicleId } from "../realtime"
import { DirectionId, ViaVariant } from "../schedule"
import { DrawnStatus, drawnStatus, HeadwaySpacing } from "./vehicleStatus"

export interface LadderVehicle {
  vehicleId: VehicleId
  label: string
  runId: string | null
  viaVariant: ViaVariant | null
  status: DrawnStatus
  headwaySpacing: HeadwaySpacing | null
  x: number
  y: number
  vehicleDirection: VehicleDirection
  scheduledY?: number
  scheduledVehicleDirection?: VehicleDirection
  lane: number
}

export enum VehicleDirection {
  Down,
  Up,
}

interface WithVehicle {
  vehicleId: VehicleId
  headwaySpacing: HeadwaySpacing | null
  label: string
  runId: string | null
  viaVariant: ViaVariant | null
  status: DrawnStatus
}

interface OnLadder {
  y: number
  vehicleDirection: VehicleDirection
  scheduledY?: number
  scheduledVehicleDirection?: VehicleDirection
}

interface VehicleOnLadder extends WithVehicle, OnLadder {}

interface InLane extends OnLadder {
  lane: number
}

interface VehicleInLane extends WithVehicle, InLane {}

const widthOfVehicleGroup = 32
const heightOfVehicleGroup = 34

/**
 * The LadderVehicle data has some order dependency in how the properties are calculated.
 * E.g. In order to calculate x we need to know what lane the vehicle is in.
 *
 * Steps:
 *  1) Calculate VehicleOnLadder --> the properties that don't depend on anything else
 *  2) Calculate the lane property
 *  3) Calculate the x property
 */
export const ladderVehiclesFromVehicles = (
  vehicles: Vehicle[],
  ghosts: Ghost[],
  ladderDirection: LadderDirection,
  timepointStatusYFunc: TimepointStatusYFunc
): {
  ladderVehicles: LadderVehicle[]
  widthOfLanes: number
} => {
  const vehiclesOnLadder: VehicleOnLadder[] = vehicles.map(vehicle =>
    vehicleOnLadder(vehicle, ladderDirection, timepointStatusYFunc)
  )

  const ghostsOnLadder: VehicleOnLadder[] = ghosts.map(ghost =>
    ghostOnLadder(ghost, ladderDirection, timepointStatusYFunc)
  )

  const vehiclesInLane: VehicleInLane[] = putIntoLanes(
    vehiclesOnLadder.concat(ghostsOnLadder)
  )

  const maxOccupiedLane: number = numOccupiedLanes(vehiclesInLane)
  const ladderVehicleHorizontalOffset: number = horizontalOffsetForLanes(
    maxOccupiedLane
  )
  const xInLane = xInLaneWithOffset(ladderVehicleHorizontalOffset)
  const widthOfLanes =
    widthOfVehicleGroup + (maxOccupiedLane - 1) * ladderVehicleHorizontalOffset

  const ladderVehicles: LadderVehicle[] = vehiclesInLane.map(vehicleInLane =>
    addX(vehicleInLane, xInLane)
  )

  return {
    ladderVehicles,
    widthOfLanes,
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
        ladderVehicle: VehicleOnLadder
      ): VehicleInLane[] => {
        const overlappers: InLane[] = overlappingPreviousVehicles(
          previousLadderVehiclePositions,
          ladderVehicle
        )
        const occupiedLanes: number[] = overlappers.map(
          overlapper => overlapper.lane
        )
        const lane = firstOpenLane(occupiedLanes)

        return [
          {
            ...ladderVehicle,
            // tslint:disable-next-line:object-literal-sort-keys
            lane,
          },
          ...previousLadderVehiclePositions,
        ]
      },
      []
    )

export const directionOnLadder = (
  directionId: DirectionId,
  ladderDirection: LadderDirection
): VehicleDirection =>
  (directionId === 1) === (ladderDirection === LadderDirection.ZeroToOne)
    ? VehicleDirection.Down
    : VehicleDirection.Up

const vehicleOnLadder = (
  vehicle: Vehicle,
  ladderDirection: LadderDirection,
  timepointStatusYFunc: TimepointStatusYFunc
): VehicleOnLadder => {
  const {
    id: vehicleId,
    headwaySpacing,
    label,
    runId,
    isOffCourse,
    viaVariant,
  } = vehicle

  const { scheduledY, scheduledVehicleDirection } = scheduledToBe(
    vehicle,
    ladderDirection,
    timepointStatusYFunc
  )

  const vehicleDirection: VehicleDirection =
    isOffCourse && scheduledVehicleDirection !== undefined
      ? scheduledVehicleDirection
      : directionOnLadder(vehicle.directionId, ladderDirection)

  const y =
    isOffCourse && scheduledY
      ? scheduledY
      : timepointStatusYFunc(vehicle.timepointStatus, vehicleDirection)

  return {
    // tslint:disable-next-line:object-literal-sort-keys
    vehicleId,
    headwaySpacing:
      featureIsEnabled("headway_ladder_colors") && !isOffCourse
        ? headwaySpacing
        : null,
    label,
    runId,
    viaVariant,
    status: drawnStatus(vehicle),
    vehicleDirection,
    y,
    scheduledY,
    scheduledVehicleDirection,
  }
}

interface ScheduledToBe {
  scheduledY: number | undefined
  scheduledVehicleDirection: VehicleDirection | undefined
}

const scheduledToBe = (
  vehicle: Vehicle,
  ladderDirection: LadderDirection,
  timepointStatusY: TimepointStatusYFunc
): ScheduledToBe => {
  const { scheduledLocation } = vehicle

  if (scheduledLocation === null) {
    return {
      scheduledY: undefined,
      scheduledVehicleDirection: undefined,
    }
  }

  const scheduledVehicleDirection: VehicleDirection = directionOnLadder(
    scheduledLocation.directionId,
    ladderDirection
  )

  const scheduledY = timepointStatusY(
    scheduledLocation.timepointStatus,
    scheduledVehicleDirection
  )

  return { scheduledY, scheduledVehicleDirection }
}

const ghostOnLadder = (
  ghost: Ghost,
  ladderDirection: LadderDirection,
  timepointStatusYFunc: TimepointStatusYFunc
): VehicleOnLadder => {
  const vehicleDirection: VehicleDirection = directionOnLadder(
    ghost.directionId,
    ladderDirection
  )
  const y = timepointStatusYFunc(
    ghost.scheduledTimepointStatus,
    vehicleDirection
  )
  return {
    // tslint:disable-next-line:object-literal-sort-keys
    vehicleId: ghost.id,
    headwaySpacing: null,
    label: "N/A",
    runId: null,
    viaVariant: ghost.viaVariant,
    status: "ghost",
    vehicleDirection,
    y,
    scheduledY: y,
    scheduledVehicleDirection: vehicleDirection,
  }
}

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
): LadderVehicle => {
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
