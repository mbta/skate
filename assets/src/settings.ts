import { isAVehicle, isShuttle } from "./models/vehicle"
import { VehicleOrGhost } from "./realtime"

export enum VehicleLabelSetting {
  RunNumber = 1,
  VehicleNumber,
}

export interface Settings {
  // DEPRECATED property
  // Can be removed after a little while along with
  // special handling code in usePersistedStateReducer. -- MSS 2019-09-11
  vehicleLabel: VehicleLabelSetting | undefined
  ladderVehicleLabel: VehicleLabelSetting
  shuttleVehicleLabel: VehicleLabelSetting
}

export const defaultSettings: Settings = {
  vehicleLabel: undefined,
  ladderVehicleLabel: VehicleLabelSetting.RunNumber,
  shuttleVehicleLabel: VehicleLabelSetting.VehicleNumber,
}

export const vehicleLabelSetting = (
  settings: Settings,
  vehicle: VehicleOrGhost
): VehicleLabelSetting =>
  isAVehicle(vehicle) && isShuttle(vehicle)
    ? settings.shuttleVehicleLabel
    : settings.ladderVehicleLabel
