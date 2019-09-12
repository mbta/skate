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

export const runIdToLabel = ({ runId }: Vehicle): string =>
  runId ? runId.split("-")[1] : "N/A"

export const labelToLabel = ({ label }: Vehicle): string => label

export default vehicleLabel
