export enum VehicleLabelSetting {
  RunNumber = 1,
  VehicleNumber,
}

export interface Settings {
  vehicleLabel: VehicleLabelSetting
}

export const defaultSettings: Settings = {
  vehicleLabel: VehicleLabelSetting.RunNumber,
}
