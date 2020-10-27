import { putUserSetting } from "./api"
import { isVehicle } from "./models/vehicle"
import { VehicleOrGhost } from "./realtime"

export enum VehicleLabelSetting {
  RunNumber = 1,
  VehicleNumber,
}

export interface UserSettings {
  ladderVehicleLabel: VehicleLabelSetting
  shuttleVehicleLabel: VehicleLabelSetting
}

export const defaultUserSettings: UserSettings = {
  ladderVehicleLabel: VehicleLabelSetting.RunNumber,
  shuttleVehicleLabel: VehicleLabelSetting.VehicleNumber,
}

export const vehicleLabelSetting = (
  settings: UserSettings,
  vehicle: VehicleOrGhost
): VehicleLabelSetting =>
  isVehicle(vehicle) && vehicle.isShuttle
    ? settings.shuttleVehicleLabel
    : settings.ladderVehicleLabel

type VehicleLabelData = "run_id" | "vehicle_id"

interface SettingsData {
  ladder_page_vehicle_label: VehicleLabelData
  shuttle_page_vehicle_label: VehicleLabelData
}

const vehicleLabelFromData = (data: VehicleLabelData): VehicleLabelSetting => {
  switch (data) {
    case "run_id":
      return VehicleLabelSetting.RunNumber
    case "vehicle_id":
      return VehicleLabelSetting.VehicleNumber
  }
}

export const settingsFromData = (data: SettingsData): UserSettings => {
  return {
    ladderVehicleLabel: vehicleLabelFromData(data.ladder_page_vehicle_label),
    shuttleVehicleLabel: vehicleLabelFromData(data.shuttle_page_vehicle_label),
  }
}

const vehicleLabelToString = (setting: VehicleLabelSetting): string => {
  switch (setting) {
    case VehicleLabelSetting.RunNumber:
      return "run_id"
    case VehicleLabelSetting.VehicleNumber:
      return "vehicle_id"
  }
}

export const putLadderVehicleLabel = (
  vehicleLabel: VehicleLabelSetting
): void => {
  putUserSetting(
    "ladder_page_vehicle_label",
    vehicleLabelToString(vehicleLabel)
  )
}

export const putShuttleVehicleLabel = (
  vehicleLabel: VehicleLabelSetting
): void => {
  putUserSetting(
    "shuttle_page_vehicle_label",
    vehicleLabelToString(vehicleLabel)
  )
}
