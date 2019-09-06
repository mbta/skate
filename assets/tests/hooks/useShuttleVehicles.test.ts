import { renderHook } from "@testing-library/react-hooks"
import { Socket } from "phoenix"
import useShuttleVehicles from "../../src/hooks/useShuttleVehicles"
import { Vehicle, VehicleTimepointStatus } from "../../src/realtime.d"

// tslint:disable: react-hooks-nesting

const makeMockSocket = () => ({
  channel: jest.fn(),
})

const makeMockChannel = (expectedJoinMessage: "ok" | "error" | "timeout") => {
  const result = {
    join: jest.fn(),
    leave: jest.fn(),
    on: jest.fn(),
    receive: jest.fn(),
  }
  result.join.mockImplementation(() => result)
  result.receive.mockImplementation((message, handler) => {
    if (message === expectedJoinMessage) {
      switch (message) {
        case "ok":
          return result

        case "error":
          handler({ reason: "ERROR_REASON" })
          break

        case "timeout":
          handler()
      }
    }

    return result
  })
  return result
}

const shuttlesData = [
  {
    bearing: 33,
    block_id: "block-1",
    block_is_active: true,
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
    headway_secs: 859.1,
    headway_spacing: null,
    id: "v1",
    is_off_course: false,
    is_laying_over: false,
    layover_departure_time: null,
    label: "v1-label",
    latitude: 0,
    longitude: 0,
    operator_id: "op1",
    operator_name: "SMITH",
    previous_vehicle_id: "v2",
    route_id: "39",
    run_id: "run-1",
    schedule_adherence_secs: 0,
    schedule_adherence_string: "0.0 sec (ontime)",
    scheduled_headway_secs: 120,
    scheduled_location: {
      direction_id: 0,
      timepoint_status: {
        fraction_until_timepoint: 0.5,
        timepoint_id: "tp1",
      },
    },
    sources: ["swiftly", "busloc"],
    speed: 50.0,
    stop_status: {
      status: "in_transit_to",
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
  },
]
const shuttles: Vehicle[] = [
  {
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
    operatorName: "SMITH",
    bearing: 33,
    speed: 50.0,
    blockId: "block-1",
    headwaySecs: 859.1,
    headwaySpacing: null,
    previousVehicleId: "v2",
    scheduleAdherenceSecs: 0,
    scheduleAdherenceString: "0.0 sec (ontime)",
    scheduledHeadwaySecs: 120,
    isOffCourse: false,
    isLayingOver: false,
    layoverDepartureTime: null,
    blockIsActive: true,
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
      status: "in_transit_to",
      stopId: "s1",
      stopName: "Stop Name",
    },
    timepointStatus: {
      timepointId: "tp1",
      fractionUntilTimepoint: 0.5,
    } as VehicleTimepointStatus,
    scheduledLocation: {
      directionId: 0,
      timepointStatus: {
        timepointId: "tp1",
        fractionUntilTimepoint: 0.5,
      },
    },
    isOnRoute: true,
    isAShuttle: false,
  },
]

describe("useShuttleVehicles", () => {
  test("shuttle list is empty to start with", () => {
    const { result } = renderHook(() => useShuttleVehicles(undefined))
    expect(result.current).toEqual([])
  })

  test("initializing the hook subscribes to the shuttles channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { rerender } = renderHook(() =>
      useShuttleVehicles((mockSocket as any) as Socket)
    )

    // Needs to be kicked to do the effects again after the socket initializes
    rerender()

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockSocket.channel).toHaveBeenCalledWith("vehicles:shuttle:all")
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("returns results pushed to the channel", async () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "shuttles") {
        handler({
          data: shuttlesData,
        })
      }
    })

    const { result } = renderHook(() =>
      useShuttleVehicles((mockSocket as any) as Socket)
    )

    expect(result.current).toEqual(shuttles)
  })

  test("console.error on join error", async () => {
    const spyConsoleError = jest.spyOn(console, "error")
    spyConsoleError.mockImplementationOnce(msg => msg)
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("error")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() => useShuttleVehicles((mockSocket as any) as Socket))

    expect(spyConsoleError).toHaveBeenCalledWith("join failed", "ERROR_REASON")
    spyConsoleError.mockRestore()
  })

  test("console.error on timeout", async () => {
    const spyConsoleError = jest.spyOn(console, "error")
    spyConsoleError.mockImplementationOnce(msg => msg)
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("timeout")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() => useShuttleVehicles((mockSocket as any) as Socket))

    expect(spyConsoleError).toHaveBeenCalledWith("join timeout")
    spyConsoleError.mockRestore()
  })
})
