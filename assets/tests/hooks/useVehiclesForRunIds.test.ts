import { renderHook } from "@testing-library/react"
import useVehiclesForRunIds from "../../src/hooks/useVehiclesForRunIds"
import { VehicleData } from "../../src/models/vehicleData"
import { dateFromEpochSeconds } from "../../src/util/dateTime"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import vehicleDataFactory from "../factories/vehicle_data"

const vehicleData: VehicleData = vehicleDataFactory.build({
  id: "y1234",
  label: "1234",
  run_id: "123-4567",
  timestamp: 1600946090,
  latitude: 42.32172773,
  longitude: -71.11216123,
  direction_id: 0,
  route_id: "39",
  trip_id: "12345678",
  headsign: "Forest Hills",
  via_variant: "3",
  operator_id: "12345",
  operator_first_name: "CHARLIE",
  operator_last_name: "ONTHEMTA",
  operator_logon_time: 1600946282,
  bearing: 0,
  block_id: "S12-34",
  previous_vehicle_id: "123",
  schedule_adherence_secs: 156,
  is_shuttle: false,
  is_overload: false,
  is_off_course: false,
  is_revenue: true,
  layover_departure_time: null,
  sources: [],
  data_discrepancies: [],
  stop_status: {
    stop_id: "61365",
    stop_name: "S Huntington Ave @ Perkins St",
  },
  timepoint_status: {
    timepoint_id: "shunt",
    fraction_until_timepoint: 0.3342478185618462,
  },
  scheduled_location: {
    route_id: "39",
    direction_id: 0,
    trip_id: "12345678",
    run_id: "123-4567",
    time_since_trip_start_time: 1321,
    headsign: "Forest Hills",
    via_variant: "3",
    timepoint_status: {
      timepoint_id: "jpctr",
      fraction_until_timepoint: 0.3277777777777778,
    },
  },
  route_status: "on_route",
  end_of_trip_type: "another_trip",
  block_waivers: [],
  crowding: {
    load: 1,
    capacity: 57,
    occupancy_status: "MANY_SEATS_AVAILABLE",
    occupancy_percentage: 0.018,
  },
})

describe("useVehiclesForRunIds", () => {
  test("returns data", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: [vehicleData] })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() => {
      return useVehiclesForRunIds(mockSocket, ["123-456"])
    })
    expect(result.current).toEqual([
      {
        bearing: 0,
        blockId: "S12-34",
        blockWaivers: [],
        crowding: {
          capacity: 57,
          load: 1,
          occupancyPercentage: 0.018,
          occupancyStatus: "MANY_SEATS_AVAILABLE",
        },
        dataDiscrepancies: [],
        directionId: 0,
        endOfTripType: "another_trip",
        headsign: "Forest Hills",
        id: "y1234",
        incomingTripDirectionId: null,
        isOffCourse: false,
        isOverload: false,
        isShuttle: false,
        isRevenue: true,
        label: "1234",
        latitude: 42.32172773,
        layoverDepartureTime: null,
        longitude: -71.11216123,
        operatorId: "12345",
        operatorLogonTime: dateFromEpochSeconds(
          vehicleData.operator_logon_time!
        ),
        operatorFirstName: "CHARLIE",
        operatorLastName: "ONTHEMTA",
        overloadOffset: undefined,
        previousVehicleId: "123",
        routeId: "39",
        routeStatus: "on_route",
        runId: "123-4567",
        scheduleAdherenceSecs: 156,
        scheduledLocation: {
          directionId: 0,
          headsign: "Forest Hills",
          routeId: "39",
          runId: "123-4567",
          timeSinceTripStartTime: 1321,
          timepointStatus: {
            fractionUntilTimepoint: 0.3277777777777778,
            timepointId: "jpctr",
          },
          tripId: "12345678",
          viaVariant: "3",
        },
        stopStatus: {
          stopId: "61365",
          stopName: "S Huntington Ave @ Perkins St",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.3342478185618462,
          timepointId: "shunt",
        },
        timestamp: 1600946090,
        tripId: "12345678",
        viaVariant: "3",
      },
    ])
  })
})
