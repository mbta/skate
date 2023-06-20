import { Ghost, Vehicle, VehicleInScheduledService } from "../realtime.d"
import { isGhost, isVehicleInScheduledService } from "./vehicle"
import { VehicleAdherenceColorsSetting } from "../userSettings"

/** Where a vehicle is relative to its schedule.
 * Swiftly assigns this to all vehicles.
 */
export type OnTimeStatus = "on-time" | "early" | "late"

/** How the vehicle triangle should be drawn,
 * taking into account the vehicle's state and the settings
 */
export type DrawnStatus = OnTimeStatus | "off-course" | "ghost" | "plain"

export const onTimeStatus = (scheduleAdherenceSecs: number): OnTimeStatus => {
  const oneMinuteInSeconds = 60
  const sixMinutesInSeconds = 360

  if (scheduleAdherenceSecs < -oneMinuteInSeconds) {
    return "early"
  } else if (scheduleAdherenceSecs > sixMinutesInSeconds) {
    return "late"
  } else {
    return "on-time"
  }
}

export const drawnStatus = (vehicleOrGhost: Vehicle | Ghost): DrawnStatus => {
  if (isGhost(vehicleOrGhost)) {
    return "ghost"
  }
  const vehicle = vehicleOrGhost

  if (isVehicleInScheduledService(vehicle) && vehicle.isShuttle) {
    return "plain"
  }

  if (vehicle.isOffCourse) {
    return "off-course"
  }

  return onTimeStatus(vehicle.scheduleAdherenceSecs)
}

export const humanReadableScheduleAdherence = (
  vehicle: VehicleInScheduledService
): string =>
  vehicle.isOffCourse
    ? "Invalid"
    : humanReadableOnTimeStatus(onTimeStatus(vehicle.scheduleAdherenceSecs))

export const humanReadableOnTimeStatus = (status: OnTimeStatus): string => {
  switch (status) {
    case "early":
      return "early"

    case "on-time":
      return "on time"

    case "late":
      return "late"
  }
}

export const statusClasses = (
  status: DrawnStatus,
  vehicleAdherenceColors: VehicleAdherenceColorsSetting
): string[] => {
  if (status === "plain") {
    return [""]
  } else {
    switch (vehicleAdherenceColors) {
      case VehicleAdherenceColorsSetting.EarlyRed:
        return [status, "early-red"]
      case VehicleAdherenceColorsSetting.EarlyBlue:
        return [status, "early-blue"]
    }
  }
}
