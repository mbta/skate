import { partition } from "../helpers/array"
import { Vehicle, VehiclesForRoute } from "../realtime"
import { ByRouteId, RouteId } from "../schedule"

interface NextAndPreviousVehicle {
  nextVehicle?: Vehicle
  previousVehicle?: Vehicle
}

export const allVehicles = (
  vehiclesForRoute: VehiclesForRoute | undefined
): Vehicle[] => {
  if (vehiclesForRoute === undefined) {
    return []
  }

  return [
    ...vehiclesForRoute.onRouteVehicles,
    ...vehiclesForRoute.incomingVehicles,
  ]
}

export const allVehiclesForRoute = (
  vehiclesByRouteId: ByRouteId<VehiclesForRoute>,
  routeId: RouteId
): Vehicle[] => allVehicles(vehiclesByRouteId[routeId])

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
      vehicle.previousVehicleId === currentVehicle.id && vehicle.isOnRoute
  )
  const previousVehicle = vehiclesGoingTheSameDirection.find(
    vehicle =>
      vehicle.id === currentVehicle.previousVehicleId && vehicle.isOnRoute
  )

  return {
    nextVehicle,
    previousVehicle,
  }
}
