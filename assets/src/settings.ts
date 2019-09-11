import { isShuttle } from "./models/vehicle"
import { Vehicle } from "./realtime"

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
  mapVehicleLabel: VehicleLabelSetting
}

export const defaultSettings: Settings = {
  vehicleLabel: undefined,
  ladderVehicleLabel: VehicleLabelSetting.RunNumber,
  mapVehicleLabel: VehicleLabelSetting.VehicleNumber,
}

export const vehicleLabelSetting = (
  settings: Settings,
  vehicle: Vehicle
): VehicleLabelSetting =>
  isShuttle(vehicle) ? settings.mapVehicleLabel : settings.ladderVehicleLabel
