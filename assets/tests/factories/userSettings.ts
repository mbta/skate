import { Factory } from "fishery"
import {
  UserSettings,
  VehicleAdherenceColorsSetting,
  VehicleLabelSetting,
} from "../../src/userSettings"

export const userSettingsFactory = Factory.define<UserSettings>(() => ({
  ladderVehicleLabel: VehicleLabelSetting.RunNumber,
  shuttleVehicleLabel: VehicleLabelSetting.VehicleNumber,
  vehicleAdherenceColors: VehicleAdherenceColorsSetting.EarlyRed,
}))
