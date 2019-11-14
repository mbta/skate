import { renderHook } from "@testing-library/react-hooks"
import { Socket } from "phoenix"
import useVehicles from "../../src/hooks/useVehicles"
import { VehicleData } from "../../src/models/vehicleData"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Vehicle, VehicleTimepointStatus } from "../../src/realtime.d"
import { RouteId } from "../../src/schedule.d"

// tslint:disable: react-hooks-nesting
// tslint:disable: object-literal-sort-keys

const makeMockSocket = () => ({
  channel: jest.fn(),
})

const makeMockChannel = (expectedJoinMessage?: "ok" | "error" | "timeout") => {
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

describe("useVehicles", () => {
  const vehiclesData: VehicleData[] = [
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
      is_nonrevenue: false,
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
      route_status: "on_route",
    },
  ]
  const vehicles: Vehicle[] = [
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
      blockId: "block-1",
      headwaySecs: 859.1,
      headwaySpacing: null,
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      scheduleAdherenceString: "0.0 sec (ontime)",
      scheduledHeadwaySecs: 120,
      isOffCourse: false,
      isNonrevenue: false,
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
      routeStatus: "on_route",
    },
  ]

  test("vehicles is empty to start with", () => {
    const { result } = renderHook(() => useVehicles(undefined, []))
    expect(result.current).toEqual({})
  })

  test("selecting a new route subscribes to the new channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { rerender } = renderHook(() =>
      useVehicles((mockSocket as any) as Socket, ["1"])
    )

    // Needs to be kicked to do the effects again after the socket initializes
    rerender()

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockSocket.channel).toHaveBeenCalledWith("vehicles:route:1")
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("unselecting a route unsubscribes from the channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { rerender } = renderHook(
      (selectedRouteIds: RouteId[]) =>
        useVehicles((mockSocket as any) as Socket, selectedRouteIds),
      { initialProps: ["1"] }
    )
    rerender([]) // Deselect the route

    expect(mockChannel.leave).toHaveBeenCalledTimes(1)
  })

  test("returns results from joining a channel", async () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.receive.mockImplementation((event, handler) => {
      if (event === "ok") {
        handler({ data: vehiclesData })
      }
      return mockChannel
    })

    const { result } = renderHook(() =>
      useVehicles((mockSocket as any) as Socket, ["1"])
    )

    expect(result.current).toEqual({
      "1": vehicles,
    })
  })

  test("returns ghost vehicles", async () => {
    const ghost: Ghost = {
      id: "ghost-trip",
      directionId: 0,
      routeId: "1",
      tripId: "trip",
      headsign: "headsign",
      blockId: "block",
      runId: null,
      viaVariant: null,
      scheduledTimepointStatus: {
        timepointId: "t0",
        fractionUntilTimepoint: 0.0,
      },
    }

    const ghostData = {
      id: "ghost-trip",
      direction_id: 0,
      route_id: "1",
      trip_id: "trip",
      headsign: "headsign",
      block_id: "block",
      run_id: null,
      via_variant: null,
      scheduled_timepoint_status: {
        timepoint_id: "t0",
        fraction_until_timepoint: 0.0,
      },
    }

    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.receive.mockImplementation((event, handler) => {
      if (event === "ok") {
        handler({ data: [ghostData] })
      }
      return mockChannel
    })

    const { result } = renderHook(() =>
      useVehicles((mockSocket as any) as Socket, ["1"])
    )

    expect(result.current).toEqual({
      "1": [ghost],
    })
  })

  test("returns results pushed to the channel", async () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "vehicles") {
        handler({ data: vehiclesData })
      }
    })

    const { result } = renderHook(() =>
      useVehicles((mockSocket as any) as Socket, ["1"])
    )

    expect(result.current).toEqual({
      "1": vehicles,
    })
  })

  test("parses headwaySpacing", async () => {
    const vehiclesDataVaryingHeadway = [
      vehiclesData[0],
      { ...vehiclesData[0], headway_spacing: "very_gapped" },
      { ...vehiclesData[0], headway_spacing: "gapped" },
      { ...vehiclesData[0], headway_spacing: "ok" },
      { ...vehiclesData[0], headway_spacing: "bunched" },
      { ...vehiclesData[0], headway_spacing: "very_bunched" },
    ]

    const expectedVehicles: Vehicle[] = [
      vehicles[0],
      { ...vehicles[0], headwaySpacing: HeadwaySpacing.VeryGapped },
      { ...vehicles[0], headwaySpacing: HeadwaySpacing.Gapped },
      { ...vehicles[0], headwaySpacing: HeadwaySpacing.Ok },
      { ...vehicles[0], headwaySpacing: HeadwaySpacing.Bunched },
      { ...vehicles[0], headwaySpacing: HeadwaySpacing.VeryBunched },
    ]

    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "vehicles") {
        handler({
          data: vehiclesDataVaryingHeadway,
        })
      }
    })

    const { result } = renderHook(() =>
      useVehicles((mockSocket as any) as Socket, ["1"])
    )

    expect(result.current).toEqual({
      "1": expectedVehicles,
    })
  })

  test("reloads the window on channel timeout", async () => {
    const reloadSpy = jest.spyOn(window.location, "reload")
    reloadSpy.mockImplementationOnce(() => ({}))
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("timeout")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() => useVehicles((mockSocket as any) as Socket, ["1"]))

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })
})
