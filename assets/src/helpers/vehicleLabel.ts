import { isVehicleInScheduledService } from "../models/vehicle"
import { Ghost, RunId, Vehicle } from "../realtime"
import {
  UserSettings,
  vehicleLabelSetting,
  VehicleLabelSetting,
} from "../userSettings"

export const runOrBusNumberLabel = (
  vehicleOrGhost: Vehicle | Ghost,
  settings: UserSettings
): string => {
  switch (vehicleLabelSetting(settings, vehicleOrGhost)) {
    case VehicleLabelSetting.RunNumber:
      return runIdToLabel(vehicleOrGhost.runId)
    case VehicleLabelSetting.VehicleNumber:
      return isVehicleInScheduledService(vehicleOrGhost)
        ? vehicleOrGhost.label || "N/A"
        : "N/A"
  }
}

const vehicleLabel = (
  vehicleOrGhost: Vehicle | Ghost,
  settings: UserSettings
): string => {
  if (
    isVehicleInScheduledService(vehicleOrGhost) &&
    vehicleOrGhost.isOverload
  ) {
    return "ADDED"
  }
  if (
    isVehicleInScheduledService(vehicleOrGhost) &&
    vehicleOrGhost.endOfTripType === "swing_off"
  ) {
    return "SW-OFF"
  }
  if (
    isVehicleInScheduledService(vehicleOrGhost) &&
    vehicleOrGhost.endOfTripType === "pull_back"
  ) {
    return "PULL-B"
  }

  return runOrBusNumberLabel(vehicleOrGhost, settings)
}

export const runIdToLabel = (runId: RunId | null): string => {
  if (!runId) {
    return "N/A"
  }
  const runParts: string[] = runId.split("-")
  return runParts.length === 2
    ? runParts[0] === "999"
      ? stripLeadingZero(runParts[1])
      : runParts[1]
    : runId
}

const stripLeadingZero = (num: string): string =>
  num.startsWith("0") ? num.slice(1) : num

export default vehicleLabel
