import { HeadwaySpacing } from "../models/vehicleStatus"
import {
  DataDiscrepancy,
  Ghost,
  Vehicle,
  VehicleScheduledLocation,
  VehicleStatus,
  VehicleStopStatus,
  VehicleTimepointStatus,
} from "../realtime.d"
import { DirectionId, RouteId } from "../schedule.d"

type RawHeadwaySpacing =
  | "very_bunched"
  | "bunched"
  | "ok"
  | "gapped"
  | "very_gapped"
  | null

export interface VehicleData {
  id: string
  label: string
  run_id: string | null
  timestamp: number
  latitude: number
  longitude: number
  direction_id: DirectionId
  route_id: RouteId
  trip_id: string
  headsign: string | null
  via_variant: string | null
  operator_id: string
  operator_name: string
  bearing: number
  speed: number
  block_id: string
  headway_secs: number
  headway_spacing: RawHeadwaySpacing
  previous_vehicle_id: string
  schedule_adherence_secs: number
  schedule_adherence_string: string
  scheduled_headway_secs: number
  is_off_course: boolean
  is_laying_over: boolean
  layover_departure_time: number | null
  block_is_active: boolean
  sources: string[]
  data_discrepancies: DataDiscrepancyData[]
  stop_status: VehicleStopStatusData
  timepoint_status: VehicleTimepointStatusData | null
  scheduled_location: VehicleScheduledLocationData | null
}

export interface GhostData {
  id: string
  direction_id: DirectionId
  route_id: string
  trip_id: string
  headsign: string
  block_id: string
  run_id: string | null
  via_variant: string | null
  scheduled_timepoint_status: VehicleTimepointStatusData
}

interface DataDiscrepancyData {
  attribute: string
  sources: DataDiscrepancySourceData[]
}

interface DataDiscrepancySourceData {
  id: string
  value: string
}

interface VehicleScheduledLocationData {
  direction_id: DirectionId
  timepoint_status: VehicleTimepointStatusData
}

interface VehicleStopStatusData {
  status: VehicleStatus
  stop_id: string
  stop_name: string
}

interface VehicleTimepointStatusData {
  timepoint_id: string
  fraction_until_timepoint: number
}

export const vehicleFromData = ({ isOnRoute }: { isOnRoute: boolean }) => (
  vehicleData: VehicleData
): Vehicle => ({
  id: vehicleData.id,
  label: vehicleData.label,
  runId: vehicleData.run_id,
  timestamp: vehicleData.timestamp,
  latitude: vehicleData.latitude,
  longitude: vehicleData.longitude,
  directionId: vehicleData.direction_id,
  routeId: vehicleData.route_id,
  tripId: vehicleData.trip_id,
  headsign: vehicleData.headsign,
  viaVariant: vehicleData.via_variant,
  operatorId: vehicleData.operator_id,
  operatorName: vehicleData.operator_name,
  bearing: vehicleData.bearing,
  speed: vehicleData.speed,
  blockId: vehicleData.block_id,
  headwaySecs: vehicleData.headway_secs,
  headwaySpacing: headwaySpacing(vehicleData.headway_spacing),
  previousVehicleId: vehicleData.previous_vehicle_id,
  scheduleAdherenceSecs: vehicleData.schedule_adherence_secs,
  scheduleAdherenceString: vehicleData.schedule_adherence_string,
  scheduledHeadwaySecs: vehicleData.scheduled_headway_secs,
  isOffCourse: vehicleData.is_off_course,
  isLayingOver: vehicleData.is_laying_over,
  layoverDepartureTime: vehicleData.layover_departure_time,
  blockIsActive: vehicleData.block_is_active,
  dataDiscrepancies: dataDiscrepanciesFromData(vehicleData.data_discrepancies),
  stopStatus: vehicleStopStatusFromData(vehicleData.stop_status),
  timepointStatus:
    vehicleData.timepoint_status &&
    vehicleTimepointStatusFromData(vehicleData.timepoint_status),
  scheduledLocation:
    vehicleData.scheduled_location &&
    vehicleScheduledLocationFromData(vehicleData.scheduled_location),
  isOnRoute,
})

export const ghostFromData = (ghostData: GhostData): Ghost => ({
  id: ghostData.id,
  directionId: ghostData.direction_id,
  routeId: ghostData.route_id,
  tripId: ghostData.trip_id,
  headsign: ghostData.headsign,
  blockId: ghostData.block_id,
  runId: ghostData.run_id,
  viaVariant: ghostData.via_variant,
  scheduledTimepointStatus: vehicleTimepointStatusFromData(
    ghostData.scheduled_timepoint_status
  ),
})

const headwaySpacing = (raw: RawHeadwaySpacing): HeadwaySpacing | null => {
  switch (raw) {
    case null:
      return null

    case "very_bunched":
      return HeadwaySpacing.VeryBunched

    case "bunched":
      return HeadwaySpacing.Bunched

    case "ok":
      return HeadwaySpacing.Ok

    case "gapped":
      return HeadwaySpacing.Gapped

    case "very_gapped":
      return HeadwaySpacing.VeryGapped
  }
}

const dataDiscrepanciesFromData = (
  dataDiscrepancies: DataDiscrepancyData[]
): DataDiscrepancy[] =>
  dataDiscrepancies.map(dataDiscrepancy => ({
    attribute: dataDiscrepancy.attribute,
    sources: dataDiscrepancy.sources,
  }))

const vehicleScheduledLocationFromData = (
  vehicleScheduledLocationData: VehicleScheduledLocationData
): VehicleScheduledLocation => ({
  directionId: vehicleScheduledLocationData.direction_id,
  timepointStatus: vehicleTimepointStatusFromData(
    vehicleScheduledLocationData.timepoint_status
  ),
})

const vehicleStopStatusFromData = (
  vehicleStopStatusData: VehicleStopStatusData
): VehicleStopStatus => ({
  status: vehicleStopStatusData.status,
  stopId: vehicleStopStatusData.stop_id,
  stopName: vehicleStopStatusData.stop_name,
})

const vehicleTimepointStatusFromData = (
  vehicleTimepointStatusData: VehicleTimepointStatusData
): VehicleTimepointStatus => ({
  timepointId: vehicleTimepointStatusData.timepoint_id,
  fractionUntilTimepoint: vehicleTimepointStatusData.fraction_until_timepoint,
})
