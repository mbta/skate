import { ScheduleAdherenceStatus, Vehicle } from "../realtime.d"

export type VehicleAdherenceStatus = ScheduleAdherenceStatus | "off-course"

export const status = (vehicle: Vehicle): VehicleAdherenceStatus =>
  vehicle.isOffCourse ? "off-course" : vehicle.scheduleAdherenceStatus
