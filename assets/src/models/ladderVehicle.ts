import { TimepointStatusYFunc } from "../components/ladder"
import { partition } from "../helpers/array"
import vehicleLabel from "../helpers/vehicleLabel"
import featureIsEnabled from "../laboratoryFeatures"
import { Ghost, Vehicle, VehicleId, VehicleOrGhost } from "../realtime"
import { ViaVariant } from "../schedule"
import { Settings } from "../settings"
import {
  directionOnLadder,
  LadderDirection,
  VehicleDirection,
} from "./ladderDirection"
import { hasBlockWaivers, isVehicle } from "./vehicle"
import { DrawnStatus, drawnStatus, HeadwaySpacing } from "./vehicleStatus"

export interface LadderVehicle {
  vehicleId: VehicleId
  label: string
  viaVariant: ViaVariant | null
  status: DrawnStatus
  hasBlockWaivers: boolean
  headwaySpacing: HeadwaySpacing | null
  x: number
  y: number
  vehicleDirection: VehicleDirection
  scheduledY?: number
  scheduledVehicleDirection?: VehicleDirection
  lane: number
}

interface WithVehicle {
  vehicleId: VehicleId
  headwaySpacing: HeadwaySpacing | null
  label: string
  viaVariant: ViaVariant | null
  status: DrawnStatus
  hasBlockWaivers: boolean
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

// tslint:disable:object-literal-sort-keys

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
  vehiclesAndGhosts: VehicleOrGhost[],
  ladderDirection: LadderDirection,
  timepointStatusYFunc: TimepointStatusYFunc,
  settings: Settings
): {
  ladderVehicles: LadderVehicle[]
  widthOfLanes: number
} => {
  const [vehicles, ghosts]: [Vehicle[], Ghost[]] = partition(
    vehiclesAndGhosts,
    isVehicle
  )

  const vehiclesOnLadder: VehicleOnLadder[] = vehicles.map(vehicle =>
    vehicleOnLadder(vehicle, ladderDirection, timepointStatusYFunc, settings)
  )

  const ghostsOnLadder: VehicleOnLadder[] = ghosts.map(ghost =>
    ghostOnLadder(ghost, ladderDirection, timepointStatusYFunc, settings)
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
            lane,
          },
          ...previousLadderVehiclePositions,
        ]
      },
      []
    )

const vehicleOnLadder = (
  vehicle: Vehicle,
  ladderDirection: LadderDirection,
  timepointStatusYFunc: TimepointStatusYFunc,
  settings: Settings
): VehicleOnLadder => {
  const { id: vehicleId, headwaySpacing, isOffCourse, viaVariant } = vehicle

  const ladderVehicleLabel = vehicleLabel(vehicle, settings)

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
    label: ladderVehicleLabel,
    viaVariant,
    status: drawnStatus(vehicle),
    hasBlockWaivers: hasBlockWaivers(vehicle),
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
  timepointStatusYFunc: TimepointStatusYFunc,
  settings: Settings
): VehicleOnLadder => {
  const ladderVehicleLabel = vehicleLabel(ghost, settings)
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
    label: ladderVehicleLabel,
    viaVariant: ghost.viaVariant,
    status: "ghost",
    hasBlockWaivers: hasBlockWaivers(ghost),
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
