import { ScheduleAdherenceStatus, Vehicle } from "../realtime.d"

export type VehicleAdherenceStatus = ScheduleAdherenceStatus | "off-course"

export enum HeadwaySpacing {
  VeryBunched,
  Bunched,
  Ok,
  Gapped,
  VeryGapped,
}

export const status = (vehicle: Vehicle): VehicleAdherenceStatus =>
  vehicle.isOffCourse ? "off-course" : vehicle.scheduleAdherenceStatus

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
