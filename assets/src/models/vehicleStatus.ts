import featureIsEnabled from "../laboratoryFeatures"
import { Vehicle } from "../realtime.d"

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

export const drawnStatus = (vehicle: Vehicle): DrawnStatus => {
  if (vehicle.isOffCourse) {
    return "off-course"
  } else if (
    isShuttle(vehicle) ||
    (featureIsEnabled("headway_ladder_colors") &&
      vehicle.headwaySpacing !== null)
  ) {
    // Headway lines give the status instead of the vehicles
    return "plain"
  } else {
    return onTimeStatus(vehicle.scheduleAdherenceSecs)
  }
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

export const statusClass = (status: DrawnStatus): string => {
  switch (status) {
    case "plain":
      return ""

    default:
      return status
  }
}

const isShuttle = (vehicle: Vehicle): boolean =>
  (vehicle.runId || "").startsWith("999")
