import { Vehicle } from "../realtime"
import { VehicleLabelSetting } from "../settings"

const vehicleLabel = (
  vehicle: Vehicle,
  vehicleLabelSetting: VehicleLabelSetting
): string => {
  switch (vehicleLabelSetting) {
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
