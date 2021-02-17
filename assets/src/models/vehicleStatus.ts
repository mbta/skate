import featureIsEnabled from "../laboratoryFeatures"
import { Vehicle, VehicleOrGhost } from "../realtime.d"
import { isGhost, isVehicle } from "./vehicle"
import { VehicleAdherenceColorsSetting } from "../userSettings"

/** Where a vehicle is relative to its schedule.
 * Swiftly assigns this to all vehicles.
 */
export type OnTimeStatus = "on-time" | "early" | "late"

export enum HeadwaySpacing {
  VeryBunched = "very-bunched",
  Bunched = "bunched",
  Ok = "ok",
  Gapped = "gapped",
  VeryGapped = "very-gapped",
}

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

export const drawnStatus = (vehicleOrGhost: VehicleOrGhost): DrawnStatus => {
  if (isGhost(vehicleOrGhost)) {
    return "ghost"
  }
  const vehicle = vehicleOrGhost

  if (isVehicle(vehicle) && vehicle.isShuttle) {
    return "plain"
  }

  if (vehicle.isOffCourse) {
    return "off-course"
  }

  if (
    featureIsEnabled("headway_ladder_colors") &&
    vehicle.headwaySpacing !== null
  ) {
    // Headway lines give the status instead of the vehicles
    return "plain"
  }

  return onTimeStatus(vehicle.scheduleAdherenceSecs)
}

export const humanReadableScheduleAdherence = (vehicle: Vehicle): string =>
  vehicle.isOffCourse
    ? "Invalid"
    : humanReadableOnTimeStatus(onTimeStatus(vehicle.scheduleAdherenceSecs))

const humanReadableOnTimeStatus = (status: OnTimeStatus): string => {
  switch (status) {
    case "early":
      return "early"

    case "on-time":
      return "on time"

    case "late":
      return "late"
  }
}

export const humanReadableHeadwaySpacing = (
  spacing: HeadwaySpacing | null
): string => {
  switch (spacing) {
    case null:
      return "good"

    case HeadwaySpacing.VeryGapped:
      return "very gapped"

    case HeadwaySpacing.Gapped:
      return "gapped"

    case HeadwaySpacing.Ok:
      return "good"

    case HeadwaySpacing.Bunched:
      return "bunched"

    case HeadwaySpacing.VeryBunched:
      return "very bunched"
  }
}

export const headwaySpacingToString = (spacing: HeadwaySpacing): string => {
  switch (spacing) {
    case HeadwaySpacing.VeryGapped:
      return "very-gapped"

    case HeadwaySpacing.Gapped:
      return "gapped"

    case HeadwaySpacing.Ok:
      return "ok"

    case HeadwaySpacing.Bunched:
      return "bunched"

    case HeadwaySpacing.VeryBunched:
      return "very-bunched"
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
