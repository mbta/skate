import { flatten, partition } from "../helpers/array"
import { Vehicle, VehicleOrGhost } from "../realtime"
import { ByRouteId } from "../schedule"

interface NextAndPreviousVehicle {
  nextVehicle?: Vehicle
  previousVehicle?: Vehicle
}

export const allVehiclesAndGhosts = (
  vehiclesByRouteId: ByRouteId<VehicleOrGhost[]>
): VehicleOrGhost[] => flatten(Object.values(vehiclesByRouteId))

/**
 * Partition vehicles by direction
 */
export const byDirection = (vehicles: Vehicle[]): Vehicle[][] =>
  partition(vehicles, (vehicle: Vehicle): boolean => vehicle.directionId === 0)

export const nextAndPreviousVehicle = (
  vehicles: Vehicle[],
  currentVehicle: Vehicle
): NextAndPreviousVehicle => {
  const vehiclesGoingTheSameDirection = byDirection(vehicles)[
    currentVehicle.directionId
  ]

  const nextVehicle = vehiclesGoingTheSameDirection.find(
    vehicle =>
      vehicle.previousVehicleId === currentVehicle.id &&
      vehicle.routeStatus == "on_route"
  )
  const previousVehicle = vehiclesGoingTheSameDirection.find(
    vehicle =>
      vehicle.id === currentVehicle.previousVehicleId &&
      vehicle.routeStatus == "on_route"
  )

  return {
    nextVehicle,
    previousVehicle,
  }
}
