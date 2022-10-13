import { renderHook } from "@testing-library/react"
import useShuttleVehicles from "../../src/hooks/useShuttleVehicles"
import { Vehicle, VehicleTimepointStatus } from "../../src/realtime.d"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import vehicleFactory from "../factories/vehicle"

const shuttlesData = [
  {
    bearing: 33,
    block_id: "block-1",
    data_discrepancies: [
      {
        attribute: "trip_id",
        sources: [
          {
            id: "swiftly",
            value: "swiftly-trip-id",
          },
          {
            id: "busloc",
            value: "busloc-trip-id",
          },
        ],
      },
      {
        attribute: "route_id",
        sources: [
          {
            id: "swiftly",
            value: null,
          },
          {
            id: "busloc",
            value: "busloc-route-id",
          },
        ],
      },
    ],
    direction_id: 0,
    headsign: "Forest Hills",
    id: "v1",
    incoming_trip_direction_id: null,
    is_shuttle: true,
    is_overload: false,
    is_off_course: false,
    is_revenue: true,
    layover_departure_time: null,
    label: "v1-label",
    latitude: 0,
    longitude: 0,
    operator_id: "op1",
    operator_first_name: "PATTI",
    operator_last_name: "SMITH",
    operator_logon_time: null,
    previous_vehicle_id: "v2",
    route_id: "39",
    run_id: "run-1",
    schedule_adherence_secs: 0,
    scheduled_location: null,
    sources: ["swiftly", "busloc"],
    stop_status: {
      stop_id: "s1",
      stop_name: "Stop Name",
    },
    timepoint_status: {
      fraction_until_timepoint: 0.5,
      timepoint_id: "tp1",
    },
    timestamp: 123,
    trip_id: "t1",
    via_variant: "X",
    route_status: "pulling_out",
    end_of_trip_type: "another_trip",
    block_waivers: [],
    crowding: null,
  },
]
const shuttles: Vehicle[] = [
  vehicleFactory.build({
    id: "v1",
    label: "v1-label",
    runId: "run-1",
    timestamp: 123,
    latitude: 0,
    longitude: 0,
    directionId: 0,
    routeId: "39",
    tripId: "t1",
    headsign: "Forest Hills",
    viaVariant: "X",
    operatorId: "op1",
    operatorFirstName: "PATTI",
    operatorLastName: "SMITH",
    operatorLogonTime: null,
    bearing: 33,
    blockId: "block-1",
    previousVehicleId: "v2",
    scheduleAdherenceSecs: 0,
    isShuttle: true,
    isOverload: false,
    isOffCourse: false,
    isRevenue: true,
    layoverDepartureTime: null,
    overloadOffset: undefined,
    dataDiscrepancies: [
      {
        attribute: "trip_id",
        sources: [
          {
            id: "swiftly",
            value: "swiftly-trip-id",
          },
          {
            id: "busloc",
            value: "busloc-trip-id",
          },
        ],
      },
      {
        attribute: "route_id",
        sources: [
          {
            id: "swiftly",
            value: null,
          },
          {
            id: "busloc",
            value: "busloc-route-id",
          },
        ],
      },
    ],
    stopStatus: {
      stopId: "s1",
      stopName: "Stop Name",
    },
    timepointStatus: {
      timepointId: "tp1",
      fractionUntilTimepoint: 0.5,
    } as VehicleTimepointStatus,
    scheduledLocation: null,
    routeStatus: "pulling_out",
    endOfTripType: "another_trip",
    blockWaivers: [],
    crowding: null,
  }),
]

describe("useShuttleVehicles", () => {
  test("returns null while loading", () => {
    const { result } = renderHook(() => useShuttleVehicles(undefined))
    expect(result.current).toEqual(null)
  })

  test("initializing the hook subscribes to the shuttles channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { rerender } = renderHook(() => useShuttleVehicles(mockSocket))

    // Needs to be kicked to do the effects again after the socket initializes
    rerender()

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockSocket.channel).toHaveBeenCalledWith("vehicles:shuttle:all")
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("returns resulting vehicles", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: shuttlesData })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() => useShuttleVehicles(mockSocket))

    expect(result.current).toEqual(shuttles)
  })
})
