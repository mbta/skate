import featureIsEnabled from "../laboratoryFeatures"
import { Vehicle, VehicleOrGhost } from "../realtime"

export const isAVehicle = (
  vehicleOrGhost: VehicleOrGhost
): vehicleOrGhost is Vehicle =>
  (vehicleOrGhost as Vehicle).routeStatus !== undefined

export const isShuttle = (vehicle: Vehicle): boolean =>
  (vehicle.runId || "").startsWith("999")

export const shouldShowHeadwayDiagram = ({
  headwaySpacing,
  routeStatus,
}: Vehicle): boolean =>
  featureIsEnabled("headway_ladder_colors") &&
  headwaySpacing !== null &&
  routeStatus === "on_route"
