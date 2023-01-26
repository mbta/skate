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
import { DirectionId, RouteId, RoutePatternId } from "../schedule.d"
import { dateFromEpochSeconds } from "../util/dateTime"
import { OccupancyStatus } from "./crowding"

export interface VehicleData {
  id: string
  label: string
  run_id: string | null
  timestamp: number
  latitude: number
  longitude: number
  direction_id: DirectionId
  route_id: RouteId
  route_pattern_id: RoutePatternId | null
  trip_id: string
  headsign: string | null
  via_variant: string | null
  operator_id: string
  operator_first_name: string
  operator_last_name: string
  operator_logon_time: number | null
  overload_offset?: number
  bearing: number
  block_id: string
  previous_vehicle_id: string
  schedule_adherence_secs: number
  incoming_trip_direction_id: DirectionId | null
  is_shuttle: boolean
  is_overload: boolean
  is_off_course: boolean
  is_revenue: boolean
  layover_departure_time: number | null
  sources: string[]
  data_discrepancies: DataDiscrepancyData[]
  stop_status: VehicleStopStatusData
  timepoint_status: VehicleTimepointStatusData | null
  scheduled_location: VehicleScheduledLocationData | null
  route_status: RouteStatus
  end_of_trip_type: EndOfTripType
  block_waivers: BlockWaiverData[]
  crowding: {
    load: number
    capacity: number
    occupancy_status: OccupancyStatus
    occupancy_percentage: number
  } | null
}

export interface GhostData {
  id: string
  direction_id: DirectionId
  route_id: string
  route_pattern_id: RoutePatternId | null
  trip_id: string
  headsign: string
  block_id: string
  run_id: string | null
  via_variant: string | null
  layover_departure_time: number | null
  scheduled_timepoint_status: VehicleTimepointStatusData
  scheduled_logon: number | null
  route_status: RouteStatus
  block_waivers: BlockWaiverData[]
  current_piece_start_place: string | null
  current_piece_first_route: string | null
  incoming_trip_direction_id: DirectionId | null
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
  route_pattern_id: RoutePatternId | null
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
  cause_id: number
  cause_description: string
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
  routePatternId: vehicleData.route_pattern_id,
  tripId: vehicleData.trip_id,
  headsign: vehicleData.headsign,
  viaVariant: vehicleData.via_variant,
  operatorId: vehicleData.operator_id,
  operatorFirstName: vehicleData.operator_first_name,
  operatorLastName: vehicleData.operator_last_name,
  operatorLogonTime: vehicleData.operator_logon_time
    ? dateFromEpochSeconds(vehicleData.operator_logon_time)
    : null,
  overloadOffset: vehicleData.overload_offset,
  bearing: vehicleData.bearing,
  blockId: vehicleData.block_id,
  previousVehicleId: vehicleData.previous_vehicle_id,
  scheduleAdherenceSecs: vehicleData.schedule_adherence_secs,
  incomingTripDirectionId: vehicleData.incoming_trip_direction_id,
  isShuttle: vehicleData.is_shuttle,
  isOverload: vehicleData.is_overload,
  isOffCourse: vehicleData.is_off_course,
  isRevenue: vehicleData.is_revenue,
  layoverDepartureTime: vehicleData.layover_departure_time,
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
  crowding: vehicleData.crowding && {
    load: vehicleData.crowding.load,
    capacity: vehicleData.crowding.capacity,
    occupancyStatus: vehicleData.crowding.occupancy_status,
    occupancyPercentage: vehicleData.crowding.occupancy_percentage,
  },
})

export const ghostFromData = (ghostData: GhostData): Ghost => ({
  id: ghostData.id,
  directionId: ghostData.direction_id,
  routeId: ghostData.route_id,
  routePatternId: ghostData.route_pattern_id,
  tripId: ghostData.trip_id,
  headsign: ghostData.headsign,
  blockId: ghostData.block_id,
  runId: ghostData.run_id,
  viaVariant: ghostData.via_variant,
  incomingTripDirectionId: ghostData.incoming_trip_direction_id,
  layoverDepartureTime: ghostData.layover_departure_time,
  scheduledTimepointStatus: vehicleTimepointStatusFromData(
    ghostData.scheduled_timepoint_status
  ),
  scheduledLogonTime: ghostData.scheduled_logon,
  routeStatus: ghostData.route_status,
  blockWaivers: blockWaiversFromData(ghostData.block_waivers),
  currentPieceFirstRoute: ghostData.current_piece_first_route,
  currentPieceStartPlace: ghostData.current_piece_start_place,
})

const isGhost = (vehicleOrGhostData: VehicleOrGhostData): boolean =>
  !Object.prototype.hasOwnProperty.call(vehicleOrGhostData, "operator_id")

export const vehicleOrGhostFromData = (
  vehicleOrGhostData: VehicleOrGhostData
): VehicleOrGhost =>
  isGhost(vehicleOrGhostData)
    ? ghostFromData(vehicleOrGhostData as GhostData)
    : vehicleFromData(vehicleOrGhostData as VehicleData)

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
  routePatternId: vehicleScheduledLocationData.route_pattern_id,
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
  causeId: blockWaiverData.cause_id,
  causeDescription: blockWaiverData.cause_description,
  remark: blockWaiverData.remark,
})
