import { VehicleDirection } from "../models/ladderDirection"
import { LadderVehicle } from "../models/ladderVehicle"
import { VehicleOrGhost } from "../realtime"

export enum LayoverBoxPosition {
  Top = 1,
  Bottom,
}

export const byLayoverDeparture = (isBottomLayoverBox: boolean) => (
  a: VehicleOrGhost,
  b: VehicleOrGhost
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
  vehiclesAndGhosts: VehicleOrGhost[],
  position: LayoverBoxPosition,
  y: number
): LadderVehicle[] => {
  const isBottomLayoverBox = position === LayoverBoxPosition.Bottom
  const numVehicles = vehiclesAndGhosts.length
  const widthPerVehicle = 30
  return vehiclesAndGhosts
    .sort(byLayoverDeparture(isBottomLayoverBox))
    .map((vehicleOrGhost, index) => {
      const x = (index - (numVehicles - 1) / 2) * widthPerVehicle
      return {
        vehicle: vehicleOrGhost,
        x,
        y,
        // vehicleDirection for the trip that will be starting soon
        vehicleDirection: isBottomLayoverBox
          ? VehicleDirection.Up
          : VehicleDirection.Down,
        scheduledY: undefined,
        scheduledVehicleDirection: undefined,
      }
    })
}
