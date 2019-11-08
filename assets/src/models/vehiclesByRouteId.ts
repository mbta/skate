import { partition } from "../helpers/array"
import { Vehicle, VehicleOrGhost, VehiclesForRoute } from "../realtime"

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

export const allVehiclesAndGhosts = (
  vehiclesForRoute: VehiclesForRoute | undefined
): VehicleOrGhost[] => {
  if (vehiclesForRoute === undefined) {
    return []
  }

  return [...allVehicles(vehiclesForRoute), ...vehiclesForRoute.ghosts]
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
    vehicle => vehicle.previousVehicleId === currentVehicle.id
  )
  const previousVehicle = vehiclesGoingTheSameDirection.find(
    vehicle => vehicle.id === currentVehicle.previousVehicleId
  )

  return {
    nextVehicle,
    previousVehicle,
  }
}
