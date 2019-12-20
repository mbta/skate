import { isVehicle } from "../models/vehicle"
import { RunId, VehicleOrGhost } from "../realtime"
import { Settings, vehicleLabelSetting, VehicleLabelSetting } from "../settings"

const vehicleLabel = (
  vehicleOrGhost: VehicleOrGhost,
  settings: Settings
): string => {
  switch (vehicleLabelSetting(settings, vehicleOrGhost)) {
    case VehicleLabelSetting.RunNumber:
      return runIdToLabel(vehicleOrGhost.runId)
    case VehicleLabelSetting.VehicleNumber:
      return isVehicle(vehicleOrGhost) ? vehicleOrGhost.label : "N/A"
  }
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
