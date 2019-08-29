import { partition } from "../helpers/array"
import { Ghost, Vehicle, VehicleId, VehiclesForRoute } from "../realtime"
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

export const findVehicleById = (
  vehiclesByRouteId: ByRouteId<VehiclesForRoute>,
  vehicleId: VehicleId | undefined
): Vehicle | undefined => {
  const vehicles: Vehicle[] = Object.values(vehiclesByRouteId).reduce(
    (acc, vehiclesForRoute) => acc.concat(allVehicles(vehiclesForRoute)),
    [] as Vehicle[]
  )
  return vehicles.find(vehicle => vehicle.id === vehicleId)
}

export const findGhostById = (
  vehiclesByRouteId: ByRouteId<VehiclesForRoute>,
  id: string | undefined
): Ghost | undefined => {
  const ghosts: Ghost[] = Object.values(vehiclesByRouteId).reduce(
    (acc, vehiclesForRoute) => acc.concat(vehiclesForRoute.ghosts),
    [] as Ghost[]
  )
  return ghosts.find(ghost => ghost.id === id)
}

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
