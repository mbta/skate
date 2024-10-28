import { VehicleInScheduledService } from "../realtime"

export type OccupancyStatus =
  | "NO_DATA"
  | "EMPTY"
  | "MANY_SEATS_AVAILABLE"
  | "FEW_SEATS_AVAILABLE"
  | "FULL"

export interface Crowding {
  load: number | null
  capacity: number | null
  occupancyStatus: OccupancyStatus
  occupancyPercentage: number | null
}

export const classModifierForStatus = (status: OccupancyStatus): string => {
  switch (status) {
    case "NO_DATA":
      return "no-data"
    case "EMPTY":
      return "empty"
    case "MANY_SEATS_AVAILABLE":
      return "not-crowded"
    case "FEW_SEATS_AVAILABLE":
      return "some-crowding"
    case "FULL":
      return "crowded"
  }
}

export const crowdingLabel = (vehicle: VehicleInScheduledService): string => {
  if (vehicle.crowding && vehicle.crowding.load !== null) {
    return `${vehicle.crowding.load}/${vehicle.crowding.capacity}`
  } else {
    return "?/?"
  }
}

export const statusDescriptionForStatus = (status: OccupancyStatus): string => {
  switch (status) {
    case "NO_DATA":
      return "No data available"
    case "EMPTY":
      return "Empty"
    case "MANY_SEATS_AVAILABLE":
      return "Not crowded"
    case "FEW_SEATS_AVAILABLE":
      return "Some crowding"
    case "FULL":
      return "Crowded"
  }
}
