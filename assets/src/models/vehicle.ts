import { Ghost, Vehicle, VehicleOrGhost } from "../realtime"
import { Route } from "../schedule"
import { now } from "../util/dateTime"

export const isVehicle = (
  vehicleOrGhost: VehicleOrGhost
): vehicleOrGhost is Vehicle => !isGhost(vehicleOrGhost)

export const isGhost = (
  vehicleOrGhost: VehicleOrGhost
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
  { directionId }: VehicleOrGhost,
  route: Route | null
): string => (route ? route.directionNames[directionId] : "")

export const filterVehicles = (
  vehiclesOrGhosts: VehicleOrGhost[] | null
): Vehicle[] => {
  return vehiclesOrGhosts === null ? [] : vehiclesOrGhosts.filter(isVehicle)
}
