import { flatten, partition } from "../helpers/array"
import { VehicleInScheduledService, Ghost } from "../realtime"
import { ByRouteId, RouteId } from "../schedule"
import { isVehicleInScheduledService } from "./vehicle"

interface NextAndPreviousVehicle {
  nextVehicle?: VehicleInScheduledService
  previousVehicle?: VehicleInScheduledService
}

export const allVehiclesAndGhosts = (
  vehiclesByRouteId: ByRouteId<(VehicleInScheduledService | Ghost)[]>
): (VehicleInScheduledService | Ghost)[] =>
  flatten(Object.values(vehiclesByRouteId))

export const allVehiclesForRoute = (
  vehiclesByRouteId: ByRouteId<(VehicleInScheduledService | Ghost)[]>,
  routeId: RouteId
): VehicleInScheduledService[] =>
  (vehiclesByRouteId[routeId] || [])
    .filter(isVehicleInScheduledService)
    .filter((vehicle) => vehicle.routeId === routeId)

/**
 * Partition vehicles by direction
 */
export const byDirection = (
  vehicles: VehicleInScheduledService[]
): VehicleInScheduledService[][] =>
  partition(
    vehicles,
    (vehicle: VehicleInScheduledService): boolean => vehicle.directionId === 0
  )

export const nextAndPreviousVehicle = (
  vehicles: VehicleInScheduledService[],
  currentVehicle: VehicleInScheduledService
): NextAndPreviousVehicle => {
  const vehiclesGoingTheSameDirection =
    byDirection(vehicles)[currentVehicle.directionId]

  const nextVehicle = vehiclesGoingTheSameDirection.find(
    (vehicle) =>
      vehicle.previousVehicleId === currentVehicle.id &&
      vehicle.routeStatus === "on_route"
  )
  const previousVehicle = vehiclesGoingTheSameDirection.find(
    (vehicle) =>
      vehicle.id === currentVehicle.previousVehicleId &&
      vehicle.routeStatus === "on_route"
  )

  return {
    nextVehicle,
    previousVehicle,
  }
}
