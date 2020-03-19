import featureIsEnabled from "../laboratoryFeatures"
import { Ghost, Vehicle, VehicleOrGhost } from "../realtime"
import { now } from "../util/dateTime"

export const isVehicle = (
  vehicleOrGhost: VehicleOrGhost
): vehicleOrGhost is Vehicle => !isGhost(vehicleOrGhost)

export const isGhost = (
  vehicleOrGhost: VehicleOrGhost
): vehicleOrGhost is Ghost => vehicleOrGhost.id.startsWith("ghost")

export const isLateVehicleIndicator = ({ id }: Ghost): boolean =>
  id.startsWith("ghost-incoming-")

export const isShuttle = (vehicle: Vehicle): boolean =>
  (vehicle.runId || "").startsWith("999")

export const isRecentlyLoggedOn = (vehicleOrGhost: VehicleOrGhost): boolean => {
  if (isGhost(vehicleOrGhost) || !vehicleOrGhost.operatorLogonTime) {
    return false
  }

  const thirtyMinutesInMs = 30 * 60 * 1000
  const timeDiffInMs =
    now().valueOf() - vehicleOrGhost.operatorLogonTime.valueOf()

  return timeDiffInMs <= thirtyMinutesInMs
}

export const shouldShowHeadwayDiagram = ({
  headwaySpacing,
  routeStatus,
}: Vehicle): boolean =>
  featureIsEnabled("headway_ladder_colors") &&
  headwaySpacing !== null &&
  routeStatus === "on_route"
