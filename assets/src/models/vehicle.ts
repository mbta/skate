import {
  Ghost,
  Vehicle,
  VehicleInScheduledService,
  VehicleOrGhost,
} from "../realtime"
import { Route } from "../schedule"
import { now } from "../util/dateTime"

export const isVehicle = (
  vehicleOrGhost: Vehicle | Ghost
): vehicleOrGhost is Vehicle => !isGhost(vehicleOrGhost)

export const isVehicleInScheduledService = (
  vehicleOrGhost: Vehicle | Ghost
): vehicleOrGhost is VehicleInScheduledService =>
  !isGhost(vehicleOrGhost) && vehicleOrGhost.directionId !== null

export const isGhost = (
  vehicleOrGhost: Vehicle | Ghost
): vehicleOrGhost is Ghost => vehicleOrGhost.id.startsWith("ghost")

export const isLateVehicleIndicator = ({ id }: Ghost): boolean =>
  id.startsWith("ghost-incoming-")

export const isRecentlyLoggedOn = (vehicleOrGhost: VehicleOrGhost): boolean => {
  if (isGhost(vehicleOrGhost) || !vehicleOrGhost.operatorLogonTime) {
    return false
  }

  const thirtyMinutesInMs = 30 * 60 * 1000
  const timeDiffInMs =
    now().valueOf() - vehicleOrGhost.operatorLogonTime.valueOf()

  return timeDiffInMs <= thirtyMinutesInMs
}

export const directionName = (
  { directionId }: Vehicle | Ghost,
  route: Route | null
): string =>
  directionId !== null && route ? route.directionNames[directionId] : ""

export const filterVehicles = (
  vehiclesOrGhosts: VehicleOrGhost[] | null
): VehicleInScheduledService[] => {
  return vehiclesOrGhosts === null
    ? []
    : vehiclesOrGhosts.filter(isVehicleInScheduledService)
}
