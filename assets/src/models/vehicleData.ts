import { HeadwaySpacing } from "../models/vehicleStatus"
import {
  BlockWaiver,
  DataDiscrepancy,
  EndOfTripType,
  Ghost,
  RouteStatus,
  RunId,
  Vehicle,
  VehicleOrGhost,
  VehicleScheduledLocation,
  VehicleStopStatus,
  VehicleTimepointStatus,
} from "../realtime.d"
import { DirectionId, RouteId } from "../schedule.d"
import { dateFromEpochSeconds } from "../util/dateTime"

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
  operator_logon_time: number | null
  bearing: number
  block_id: string
  headway_secs: number
  headway_spacing: RawHeadwaySpacing
  previous_vehicle_id: string
  schedule_adherence_secs: number
  scheduled_headway_secs: number
  is_shuttle: boolean
  is_off_course: boolean
  layover_departure_time: number | null
  block_is_active: boolean
  sources: string[]
  data_discrepancies: DataDiscrepancyData[]
  stop_status: VehicleStopStatusData
  timepoint_status: VehicleTimepointStatusData | null
  scheduled_location: VehicleScheduledLocationData | null
  route_status: RouteStatus
  end_of_trip_type: EndOfTripType
  block_waivers: BlockWaiverData[]
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
  layover_departure_time: number | null
  scheduled_timepoint_status: VehicleTimepointStatusData
  route_status: RouteStatus
  block_waivers: BlockWaiverData[]
}

export type VehicleOrGhostData = VehicleData | GhostData

interface DataDiscrepancyData {
  attribute: string
  sources: DataDiscrepancySourceData[]
}

interface DataDiscrepancySourceData {
  id: string
  value: string | null
}

interface VehicleScheduledLocationData {
  route_id: RouteId
  direction_id: DirectionId
  trip_id: string
  run_id: RunId
  time_since_trip_start_time: number
  headsign: string
  via_variant: string | null
  timepoint_status: VehicleTimepointStatusData
}

interface VehicleStopStatusData {
  stop_id: string
  stop_name: string
}

interface VehicleTimepointStatusData {
  timepoint_id: string
  fraction_until_timepoint: number
}

interface BlockWaiverData {
  start_time: number
  end_time: number
  remark: string | null
}

export const vehicleFromData = (vehicleData: VehicleData): Vehicle => ({
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
  operatorLogonTime: vehicleData.operator_logon_time
    ? dateFromEpochSeconds(vehicleData.operator_logon_time)
    : null,
  bearing: vehicleData.bearing,
  blockId: vehicleData.block_id,
  headwaySecs: vehicleData.headway_secs,
  headwaySpacing: headwaySpacing(vehicleData.headway_spacing),
  previousVehicleId: vehicleData.previous_vehicle_id,
  scheduleAdherenceSecs: vehicleData.schedule_adherence_secs,
  scheduledHeadwaySecs: vehicleData.scheduled_headway_secs,
  isShuttle: vehicleData.is_shuttle,
  isOffCourse: vehicleData.is_off_course,
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
  routeStatus: vehicleData.route_status,
  endOfTripType: vehicleData.end_of_trip_type,
  blockWaivers: blockWaiversFromData(vehicleData.block_waivers),
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
  layoverDepartureTime: ghostData.layover_departure_time,
  scheduledTimepointStatus: vehicleTimepointStatusFromData(
    ghostData.scheduled_timepoint_status
  ),
  routeStatus: ghostData.route_status,
  blockWaivers: blockWaiversFromData(ghostData.block_waivers),
})

const isGhost = (vehicleOrGhostData: VehicleOrGhostData): boolean =>
  !vehicleOrGhostData.hasOwnProperty("operator_id")

export const vehicleOrGhostFromData = (
  vehicleOrGhostData: VehicleOrGhostData
): VehicleOrGhost =>
  isGhost(vehicleOrGhostData)
    ? ghostFromData(vehicleOrGhostData as GhostData)
    : vehicleFromData(vehicleOrGhostData as VehicleData)

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
  dataDiscrepancies.map((dataDiscrepancy) => ({
    attribute: dataDiscrepancy.attribute,
    sources: dataDiscrepancy.sources,
  }))

const vehicleScheduledLocationFromData = (
  vehicleScheduledLocationData: VehicleScheduledLocationData
): VehicleScheduledLocation => ({
  routeId: vehicleScheduledLocationData.route_id,
  directionId: vehicleScheduledLocationData.direction_id,
  tripId: vehicleScheduledLocationData.trip_id,
  runId: vehicleScheduledLocationData.run_id,
  timeSinceTripStartTime:
    vehicleScheduledLocationData.time_since_trip_start_time,
  headsign: vehicleScheduledLocationData.headsign,
  viaVariant: vehicleScheduledLocationData.via_variant,
  timepointStatus: vehicleTimepointStatusFromData(
    vehicleScheduledLocationData.timepoint_status
  ),
})

const vehicleStopStatusFromData = (
  vehicleStopStatusData: VehicleStopStatusData
): VehicleStopStatus => ({
  stopId: vehicleStopStatusData.stop_id,
  stopName: vehicleStopStatusData.stop_name,
})

const vehicleTimepointStatusFromData = (
  vehicleTimepointStatusData: VehicleTimepointStatusData
): VehicleTimepointStatus => ({
  timepointId: vehicleTimepointStatusData.timepoint_id,
  fractionUntilTimepoint: vehicleTimepointStatusData.fraction_until_timepoint,
})

const blockWaiversFromData = (
  blockWaiverDataList: BlockWaiverData[]
): BlockWaiver[] => blockWaiverDataList.map(blockWaiverFromData)

const blockWaiverFromData = (
  blockWaiverData: BlockWaiverData
): BlockWaiver => ({
  startTime: dateFromEpochSeconds(blockWaiverData.start_time),
  endTime: dateFromEpochSeconds(blockWaiverData.end_time),
  remark: blockWaiverData.remark,
})
