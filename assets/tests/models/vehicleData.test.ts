import {
  ghostFromData,
  vehicleInScheduledServiceFromData,
} from "../../src/models/vehicleData"
import { dateFromEpochSeconds } from "../../src/util/dateTime"
import ghostDataFactory from "../factories/ghost_data"
import vehicleDataFactory from "../factories/vehicle_data"

describe("vehicleFromData", () => {
  test("returns vehicle data in expected format", () => {
    const vehicleData = vehicleDataFactory.build({
      crowding: {
        capacity: 50,
        load: 25,
        occupancy_percentage: 50,
        occupancy_status: "MANY_SEATS_AVAILABLE",
      },
    })
    expect(vehicleInScheduledServiceFromData(vehicleData)).toEqual({
      bearing: vehicleData.bearing,
      blockId: vehicleData.block_id,
      blockWaivers: vehicleData.block_waivers,
      crowding: {
        capacity: vehicleData.crowding?.capacity,
        load: vehicleData.crowding?.load,
        occupancyPercentage: vehicleData.crowding?.occupancy_percentage,
        occupancyStatus: vehicleData.crowding?.occupancy_status,
      },
      dataDiscrepancies: vehicleData.data_discrepancies,
      directionId: vehicleData.direction_id,
      endOfTripType: vehicleData.end_of_trip_type,
      headsign: vehicleData.headsign,
      id: vehicleData.id,
      incomingTripDirectionId: vehicleData.incoming_trip_direction_id,
      isOffCourse: vehicleData.is_off_course,
      isOverload: vehicleData.is_overload,
      isShuttle: vehicleData.is_shuttle,
      isRevenue: vehicleData.is_revenue,
      label: vehicleData.label,
      latitude: vehicleData.latitude,
      layoverDepartureTime: vehicleData.layover_departure_time,
      longitude: vehicleData.longitude,
      operatorId: vehicleData.operator_id,
      operatorLogonTime: dateFromEpochSeconds(vehicleData.operator_logon_time!),
      operatorFirstName: vehicleData.operator_first_name,
      operatorLastName: vehicleData.operator_last_name,
      overloadOffset: undefined,
      previousVehicleId: vehicleData.previous_vehicle_id,
      routeId: vehicleData.route_id,
      routePatternId: vehicleData.route_pattern_id,
      routeStatus: vehicleData.route_status,
      runId: vehicleData.run_id,
      scheduleAdherenceSecs: vehicleData.schedule_adherence_secs,
      scheduledLocation: {
        directionId: vehicleData.scheduled_location?.direction_id,
        headsign: vehicleData.scheduled_location?.headsign,
        routeId: vehicleData.scheduled_location?.route_id,
        routePatternId: vehicleData.scheduled_location?.route_pattern_id,
        runId: vehicleData.scheduled_location?.run_id,
        timeSinceTripStartTime:
          vehicleData.scheduled_location?.time_since_trip_start_time,
        timepointStatus: {
          fractionUntilTimepoint:
            vehicleData.scheduled_location?.timepoint_status
              .fraction_until_timepoint,
          timepointId:
            vehicleData.scheduled_location?.timepoint_status.timepoint_id,
        },
        tripId: vehicleData.scheduled_location?.trip_id,
        viaVariant: vehicleData.scheduled_location?.via_variant,
      },
      stopStatus: {
        stopId: vehicleData.stop_status.stop_id,
        stopName: vehicleData.stop_status.stop_name,
      },
      timepointStatus: {
        fractionUntilTimepoint:
          vehicleData.timepoint_status?.fraction_until_timepoint,
        timepointId: vehicleData.timepoint_status?.timepoint_id,
      },
      timestamp: vehicleData.timestamp,
      tripId: vehicleData.trip_id,
      viaVariant: vehicleData.via_variant,
    })
  })
})

describe("ghostFromData", () => {
  test("returns data in the expected format", () => {
    const ghostData = ghostDataFactory.build()
    expect(ghostFromData(ghostData)).toEqual({
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
      scheduledTimepointStatus: {
        timepointId: ghostData.scheduled_timepoint_status.timepoint_id,
        fractionUntilTimepoint:
          ghostData.scheduled_timepoint_status.fraction_until_timepoint,
      },
      scheduledLogonTime: ghostData.scheduled_logon,
      routeStatus: ghostData.route_status,
      blockWaivers: ghostData.block_waivers.map((blockWaiverData) => ({
        startTime: dateFromEpochSeconds(blockWaiverData.start_time),
        endTime: dateFromEpochSeconds(blockWaiverData.end_time),
        causeId: blockWaiverData.cause_id,
        causeDescription: blockWaiverData.cause_description,
        remark: blockWaiverData.remark,
      })),
      currentPieceFirstRoute: ghostData.current_piece_first_route,
      currentPieceStartPlace: ghostData.current_piece_start_place,
    })
  })
})
