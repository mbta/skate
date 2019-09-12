import { isShuttle } from "../models/vehicle"
import { Vehicle } from "../realtime"
import { Settings, vehicleLabelSetting, VehicleLabelSetting } from "../settings"

const vehicleLabel = (vehicle: Vehicle, settings: Settings): string => {
  switch (vehicleLabelSetting(settings, vehicle)) {
    case VehicleLabelSetting.RunNumber:
      return runIdToLabel(vehicle)
    case VehicleLabelSetting.VehicleNumber:
      return labelToLabel(vehicle)
  }
}

export const runIdToLabel = (vehicle: Vehicle): string => {
  const { runId } = vehicle

  if (!runId) {
    return "N/A"
  }

  const runSecondHalf = runId.split("-")[1]

  return isShuttle(vehicle) ? stripLeadingZero(runSecondHalf) : runSecondHalf
}

export const labelToLabel = ({ label }: Vehicle): string => label

const stripLeadingZero = (num: string): string =>
  num.startsWith("0") ? num.slice(1) : num

export default vehicleLabel
