import { VehicleDirection } from "../models/ladderDirection"
import { LadderVehicle } from "../models/ladderVehicle"
import { VehicleInScheduledService, Ghost } from "../realtime"
import { TimepointStatusYFunc } from "../components/ladder"
import { isVehicleInScheduledService } from "./vehicle"

export enum LayoverBoxPosition {
  Top = 1,
  Bottom,
}

export const byLayoverDeparture =
  (isBottomLayoverBox: boolean) =>
  (
    a: VehicleInScheduledService | Ghost,
    b: VehicleInScheduledService | Ghost
  ): number => {
    const [lt, gt] = isBottomLayoverBox ? [1, -1] : [-1, 1]
    if (
      !a.layoverDepartureTime ||
      !b.layoverDepartureTime ||
      a.layoverDepartureTime === b.layoverDepartureTime
    ) {
      return 0
    }

    return a.layoverDepartureTime > b.layoverDepartureTime ? gt : lt
  }

export const ladderVehiclesForLayovers = (
  vehiclesAndGhosts: (VehicleInScheduledService | Ghost)[],
  position: LayoverBoxPosition,
  timepointStatusY: TimepointStatusYFunc,
  y: number
): LadderVehicle[] => {
  const isBottomLayoverBox = position === LayoverBoxPosition.Bottom
  const numVehicles = vehiclesAndGhosts.length
  // vehicleDirection for the trip that will be starting soon
  const vehicleDirection: VehicleDirection = isBottomLayoverBox
    ? VehicleDirection.Up
    : VehicleDirection.Down
  return vehiclesAndGhosts
    .sort(byLayoverDeparture(isBottomLayoverBox))
    .map((vehicleOrGhost, index) => {
      const scheduledY = vehicleScheduledY(
        vehicleOrGhost,
        timepointStatusY,
        /* We can only use the realtime vehicleDirection to calculate the scheduled position because
        we only show the scheduled line if the scheduled trip is the same as the realtime trip. */
        vehicleDirection
      )
      return {
        vehicle: vehicleOrGhost,
        x: x(index, numVehicles),
        y,
        vehicleDirection,
        scheduledY,
        scheduledVehicleDirection:
          scheduledY !== undefined ? vehicleDirection : undefined,
      }
    })
}

const x = (index: number, numVehicles: number): number => {
  const widthPerVehicle = 30
  return (index - (numVehicles - 1) / 2) * widthPerVehicle
}

const vehicleScheduledY = (
  vehicle: VehicleInScheduledService | Ghost,
  timepointStatusY: TimepointStatusYFunc,
  scheduledVehicleDirection: VehicleDirection
) =>
  isVehicleInScheduledService(vehicle) &&
  vehicle.scheduledLocation !== null &&
  vehicle.scheduledLocation.tripId === vehicle.tripId &&
  vehicle.scheduledLocation.timeSinceTripStartTime >= 0
    ? timepointStatusY(
        vehicle.scheduledLocation.timepointStatus,
        scheduledVehicleDirection
      )
    : undefined
