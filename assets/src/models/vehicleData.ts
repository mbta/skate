import {
  array,
  boolean,
  enums,
  Infer,
  nullable,
  number,
  optional,
  string,
  type,
} from "superstruct"
import {
  BlockWaiver,
  DataDiscrepancy,
  Ghost,
  Vehicle,
  VehicleInScheduledService,
  VehicleScheduledLocation,
  VehicleStopStatus,
  VehicleTimepointStatus,
} from "../realtime.d"
import { dateFromEpochSeconds } from "../util/dateTime"
import { DirectionIdData } from "./miscData"

const DataDiscrepancySourceData = type({
  id: string(),
  value: nullable(string()),
})

const DataDiscrepancyData = type({
  attribute: string(),
  sources: array(DataDiscrepancySourceData),
})
type DataDiscrepancyData = Infer<typeof DataDiscrepancyData>

const VehicleStopStatusData = type({
  stop_id: nullable(string()),
  stop_name: nullable(string()),
})
type VehicleStopStatusData = Infer<typeof VehicleStopStatusData>

const VehicleTimepointStatusData = type({
  timepoint_id: string(),
  fraction_until_timepoint: number(),
})
type VehicleTimepointStatusData = Infer<typeof VehicleTimepointStatusData>

const VehicleScheduledLocationData = type({
  route_id: string(),
  route_pattern_id: nullable(string()),
  direction_id: DirectionIdData,
  trip_id: string(),
  run_id: string(),
  time_since_trip_start_time: number(),
  headsign: string(),
  via_variant: nullable(string()),
  timepoint_status: VehicleTimepointStatusData,
})
type VehicleScheduledLocationData = Infer<typeof VehicleScheduledLocationData>

const BlockWaiverData = type({
  start_time: number(),
  end_time: number(),
  cause_id: number(),
  cause_description: string(),
  remark: nullable(string()),
})
type BlockWaiverData = Infer<typeof BlockWaiverData>

const RouteStatusData = enums(["on_route", "laying_over", "pulling_out"])

const EndOfTripTypeData = enums(["another_trip", "swing_off", "pull_back"])

const OccupancyStatusData = enums([
  "NO_DATA",
  "EMPTY",
  "MANY_SEATS_AVAILABLE",
  "FEW_SEATS_AVAILABLE",
  "FULL",
])

const CrowdingData = type({
  load: nullable(number()),
  capacity: nullable(number()),
  occupancy_status: nullable(OccupancyStatusData),
  occupancy_percentage: nullable(number()),
})

const baseVehicleData = {
  id: string(),
  label: nullable(string()),
  run_id: nullable(string()),
  timestamp: number(),
  latitude: number(),
  longitude: number(),
  direction_id: nullable(DirectionIdData),
  route_id: nullable(string()),
  route_pattern_id: nullable(string()),
  trip_id: nullable(string()),
  headsign: nullable(string()),
  via_variant: nullable(string()),
  operator_id: nullable(string()),
  operator_first_name: nullable(string()),
  operator_last_name: nullable(string()),
  operator_logon_time: nullable(number()),
  overload_offset: nullable(number()),
  bearing: nullable(number()),
  block_id: nullable(string()),
  previous_vehicle_id: nullable(string()),
  schedule_adherence_secs: nullable(number()),
  incoming_trip_direction_id: nullable(DirectionIdData),
  is_shuttle: boolean(),
  is_overload: boolean(),
  is_off_course: boolean(),
  is_revenue: nullable(boolean()),
  layover_departure_time: nullable(number()),
  pull_back_place_name: nullable(string()),
  sources: array(string()),
  data_discrepancies: array(DataDiscrepancyData),
  stop_status: VehicleStopStatusData,
  timepoint_status: nullable(VehicleTimepointStatusData),
  scheduled_location: nullable(VehicleScheduledLocationData),
  route_status: RouteStatusData,
  end_of_trip_type: EndOfTripTypeData,
  block_waivers: array(BlockWaiverData),
  crowding: nullable(CrowdingData),
}

export const VehicleData = type(baseVehicleData)
export type VehicleData = Infer<typeof VehicleData>

export const VehicleInScheduledServiceData = type({
  ...baseVehicleData,
  direction_id: DirectionIdData,
  route_id: string(),
  block_id: string(),
})
export type VehicleInScheduledServiceData = Infer<
  typeof VehicleInScheduledServiceData
>

export const GhostData = type({
  id: string(),
  direction_id: DirectionIdData,
  route_id: string(),
  route_pattern_id: optional(string()),
  trip_id: string(),
  headsign: string(),
  block_id: string(),
  run_id: nullable(string()),
  via_variant: nullable(string()),
  layover_departure_time: nullable(number()),
  scheduled_timepoint_status: VehicleTimepointStatusData,
  scheduled_logon: nullable(number()),
  route_status: RouteStatusData,
  block_waivers: array(BlockWaiverData),
  current_piece_start_place: nullable(string()),
  current_piece_first_route: nullable(string()),
  incoming_trip_direction_id: nullable(DirectionIdData),
})
export type GhostData = Infer<typeof GhostData>

export function vehicleFromData(
  vehicleData: VehicleInScheduledServiceData
): VehicleInScheduledService
export function vehicleFromData(vehicleData: VehicleData): Vehicle
export function vehicleFromData(
  vehicleData: VehicleData | VehicleInScheduledServiceData
): Vehicle | VehicleInScheduledService {
  return {
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
    overloadOffset: vehicleData.overload_offset || undefined,
    bearing: vehicleData.bearing || undefined,
    blockId: vehicleData.block_id,
    previousVehicleId: vehicleData.previous_vehicle_id,
    scheduleAdherenceSecs: vehicleData.schedule_adherence_secs,
    incomingTripDirectionId: vehicleData.incoming_trip_direction_id,
    isShuttle: vehicleData.is_shuttle,
    isOverload: vehicleData.is_overload,
    isOffCourse: vehicleData.is_off_course,
    isRevenue: vehicleData.is_revenue,
    layoverDepartureTime: vehicleData.layover_departure_time,
    pullbackPlaceName: vehicleData.pull_back_place_name,
    dataDiscrepancies: dataDiscrepanciesFromData(
      vehicleData.data_discrepancies
    ),
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
      occupancyStatus: vehicleData.crowding.occupancy_status || "NO_DATA",
      occupancyPercentage: vehicleData.crowding.occupancy_percentage,
    },
  }
}

export const ghostFromData = (ghostData: GhostData): Ghost => ({
  id: ghostData.id,
  directionId: ghostData.direction_id,
  routeId: ghostData.route_id,
  routePatternId: ghostData.route_pattern_id || null,
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

function isGhost(
  vehicleOrGhostData: VehicleData | GhostData
): vehicleOrGhostData is GhostData {
  return !Object.prototype.hasOwnProperty.call(
    vehicleOrGhostData,
    "operator_id"
  )
}

export function vehicleOrGhostFromData(
  vehicleOrGhostData: VehicleData | GhostData
): Vehicle | Ghost {
  return isGhost(vehicleOrGhostData)
    ? ghostFromData(vehicleOrGhostData)
    : vehicleFromData(vehicleOrGhostData)
}

export function vehicleInScheduledServiceOrGhostFromData(
  vehicleOrGhostData: VehicleInScheduledServiceData | GhostData
): VehicleInScheduledService | Ghost {
  return isGhost(vehicleOrGhostData)
    ? ghostFromData(vehicleOrGhostData)
    : vehicleFromData(vehicleOrGhostData)
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
