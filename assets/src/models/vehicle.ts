import featureIsEnabled from "../laboratoryFeatures"
import { Ghost, Vehicle, VehicleOrGhost } from "../realtime"

export const isVehicle = (
  vehicleOrGhost: VehicleOrGhost
): vehicleOrGhost is Vehicle =>
  (vehicleOrGhost as Vehicle).routeStatus !== undefined

export const isGhost = (
  vehicleOrGhost: VehicleOrGhost
): vehicleOrGhost is Ghost => !isVehicle(vehicleOrGhost)

export const isShuttle = (vehicle: Vehicle): boolean =>
  (vehicle.runId || "").startsWith("999")

export const shouldShowHeadwayDiagram = ({
  headwaySpacing,
  routeStatus,
}: Vehicle): boolean =>
  featureIsEnabled("headway_ladder_colors") &&
  headwaySpacing !== null &&
  routeStatus === "on_route"
