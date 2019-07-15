import { ScheduleAdherenceStatus, Vehicle } from "../skate"

export type VehicleAdherenceStatus = ScheduleAdherenceStatus | "off-course"

export const status = (vehicle: Vehicle): VehicleAdherenceStatus =>
  isUnassignedBySwiftly(vehicle)
    ? "off-course"
    : vehicle.scheduleAdherenceStatus

export const isUnassignedBySwiftly = ({
  dataDiscrepancies,
}: Vehicle): boolean => {
  const tripIdDiscrepancy = dataDiscrepancies.find(
    ({ attribute }) => attribute === "trip_id"
  )
  if (!tripIdDiscrepancy) {
    return false
  }

  const swiftlySource = tripIdDiscrepancy.sources.find(
    ({ id }) => id === "swiftly"
  )
  if (!swiftlySource) {
    return false
  }

  return swiftlySource.value === null
}
