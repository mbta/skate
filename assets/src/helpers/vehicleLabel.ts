import { isVehicle } from "../models/vehicle"
import { RunId, VehicleOrGhost } from "../realtime"
import {
  UserSettings,
  vehicleLabelSetting,
  VehicleLabelSetting,
} from "../userSettings"

export const runOrBusNumberLabel = (
  vehicleOrGhost: VehicleOrGhost,
  settings: UserSettings
): string => {
  switch (vehicleLabelSetting(settings, vehicleOrGhost)) {
    case VehicleLabelSetting.RunNumber:
      return runIdToLabel(vehicleOrGhost.runId)
    case VehicleLabelSetting.VehicleNumber:
      return isVehicle(vehicleOrGhost) ? vehicleOrGhost.label : "N/A"
  }
}

const vehicleLabel = (
  vehicleOrGhost: VehicleOrGhost,
  settings: UserSettings
): string => {
  if (isVehicle(vehicleOrGhost) && vehicleOrGhost.isOverload) {
    return "ADDED"
  }
  if (
    isVehicle(vehicleOrGhost) &&
    vehicleOrGhost.endOfTripType === "swing_off"
  ) {
    return "SW-OFF"
  }
  if (
    isVehicle(vehicleOrGhost) &&
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
