import { Vehicle, VehicleOrGhost } from "../realtime"

export const isAVehicle = (
  vehicleOrGhost: VehicleOrGhost
): vehicleOrGhost is Vehicle =>
  (vehicleOrGhost as Vehicle).isOnRoute !== undefined

export const isShuttle = (vehicle: Vehicle): boolean =>
  (vehicle.runId || "").startsWith("999")
