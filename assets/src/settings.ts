import { isVehicle } from "./models/vehicle"
import { VehicleOrGhost } from "./realtime"

export enum VehicleLabelSetting {
  RunNumber = 1,
  VehicleNumber,
}

export interface Settings {
  ladderVehicleLabel: VehicleLabelSetting
  shuttleVehicleLabel: VehicleLabelSetting
}

export const defaultSettings: Settings = {
  ladderVehicleLabel: VehicleLabelSetting.RunNumber,
  shuttleVehicleLabel: VehicleLabelSetting.VehicleNumber,
}

export const vehicleLabelSetting = (
  settings: Settings,
  vehicle: VehicleOrGhost
): VehicleLabelSetting =>
  isVehicle(vehicle) && vehicle.isShuttle
    ? settings.shuttleVehicleLabel
    : settings.ladderVehicleLabel
