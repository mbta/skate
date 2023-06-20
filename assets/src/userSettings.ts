import { putUserSetting } from "./api"
import { isVehicleInScheduledService } from "./models/vehicle"
import { Ghost, Vehicle } from "./realtime"

export enum VehicleLabelSetting {
  RunNumber = 1,
  VehicleNumber,
}

export enum VehicleAdherenceColorsSetting {
  EarlyRed = 1,
  EarlyBlue,
}

export interface UserSettings {
  ladderVehicleLabel: VehicleLabelSetting
  shuttleVehicleLabel: VehicleLabelSetting
  vehicleAdherenceColors: VehicleAdherenceColorsSetting
}

export const defaultUserSettings: UserSettings = {
  ladderVehicleLabel: VehicleLabelSetting.RunNumber,
  shuttleVehicleLabel: VehicleLabelSetting.VehicleNumber,
  vehicleAdherenceColors: VehicleAdherenceColorsSetting.EarlyRed,
}

export const vehicleLabelSetting = (
  settings: UserSettings,
  vehicle: Vehicle | Ghost
): VehicleLabelSetting =>
  isVehicleInScheduledService(vehicle) && vehicle.isShuttle
    ? settings.shuttleVehicleLabel
    : settings.ladderVehicleLabel

export type VehicleLabelData = "run_id" | "vehicle_id"
export type VehicleAdherenceColorsData = "early_red" | "early_blue"

interface SettingsData {
  ladder_page_vehicle_label: VehicleLabelData
  shuttle_page_vehicle_label: VehicleLabelData
  vehicle_adherence_colors: VehicleAdherenceColorsData
}

const vehicleLabelFromData = (data: VehicleLabelData): VehicleLabelSetting => {
  switch (data) {
    case "run_id":
      return VehicleLabelSetting.RunNumber
    case "vehicle_id":
      return VehicleLabelSetting.VehicleNumber
  }
}

const vehicleAdherenceColorsFromData = (
  data?: VehicleAdherenceColorsData
): VehicleAdherenceColorsSetting => {
  switch (data) {
    case "early_red":
      return VehicleAdherenceColorsSetting.EarlyRed
    case "early_blue":
      return VehicleAdherenceColorsSetting.EarlyBlue
    default:
      return VehicleAdherenceColorsSetting.EarlyRed
  }
}

export const userSettingsFromData = (data: SettingsData): UserSettings => {
  return {
    ladderVehicleLabel: vehicleLabelFromData(data.ladder_page_vehicle_label),
    shuttleVehicleLabel: vehicleLabelFromData(data.shuttle_page_vehicle_label),
    vehicleAdherenceColors: vehicleAdherenceColorsFromData(
      data.vehicle_adherence_colors
    ),
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

const vehicleAdherenceColorsToString = (
  setting: VehicleAdherenceColorsSetting
): string => {
  switch (setting) {
    case VehicleAdherenceColorsSetting.EarlyRed:
      return "early_red"
    case VehicleAdherenceColorsSetting.EarlyBlue:
      return "early_blue"
  }
}

export const putVehicleAdherenceColors = (
  vehicleAdherenceColors: VehicleAdherenceColorsSetting
): void => {
  putUserSetting(
    "vehicle_adherence_colors",
    vehicleAdherenceColorsToString(vehicleAdherenceColors)
  )
}
