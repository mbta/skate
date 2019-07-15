import { Socket } from "phoenix"
import { renderHook } from "react-hooks-testing-library"
import useVehicles from "../../src/hooks/useVehicles"
import { RouteId, Vehicle } from "../../src/skate"

// tslint:disable: react-hooks-nesting

const makeMockSocket = () => ({
  channel: jest.fn(),
})

const makeMockChannel = () => {
  const result = {
    join: jest.fn(),
    leave: jest.fn(),
    on: jest.fn(),
    receive: jest.fn(),
  }
  result.join.mockImplementation(() => result)
  result.receive.mockImplementation(() => result)
  return result
}

describe("useVehicles", () => {
  const vehiclesData = [
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
      headway_secs: 859.1,
      id: "v1",
      label: "v1-label",
      latitude: 0,
      longitude: 0,
      operator_id: "op1",
      operator_name: "SMITH",
      previous_vehicle_id: "v2",
      route_id: "39",
      route_status: "on_route",
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
      speed: 50.0,
      blockId: "block-1",
      headwaySecs: 859.1,
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      scheduleAdherenceString: "0.0 sec (ontime)",
      scheduleAdherenceStatus: "on-time",
      scheduledHeadwaySecs: 120,
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
        fractionUntilTimepoint: 0.5,
        timepointId: "tp1",
      },
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
    expect(mockSocket.channel).toHaveBeenCalledWith("vehicles:1")
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
        handler({ vehicles: vehiclesData })
      }
      return mockChannel
    })

    const { result } = renderHook(() =>
      useVehicles((mockSocket as any) as Socket, ["1"])
    )

    expect(result.current).toEqual({ "1": vehicles })
  })

  test("returns results pushed to the channel", async () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "vehicles") {
        handler({ vehicles: vehiclesData })
      }
    })

    const { result } = renderHook(() =>
      useVehicles((mockSocket as any) as Socket, ["1"])
    )

    expect(result.current).toEqual({ "1": vehicles })
  })

  test("generates a schedule adherence status", async () => {
    const vehiclesDataVaryingStatus = [
      {
        bearing: 33,
        block_id: "block-1",
        data_discrepancies: [],
        direction_id: 0,
        headsign: "Forest Hills",
        headway_secs: 859.1,
        id: "v1",
        label: "v1-label",
        latitude: 0,
        longitude: 0,
        operator_id: "op1",
        operator_name: "SMITH",
        previous_vehicle_id: "v2",
        route_id: "39",
        route_status: "on_route",
        run_id: "run-1",
        // On-time
        schedule_adherence_secs: 0,
        schedule_adherence_string: "0.0 sec (ontime)",
        scheduled_headway_secs: 120,
        scheduled_location: null,
        sources: ["swiftly"],
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
      {
        bearing: 33,
        block_id: "block-1",
        data_discrepancies: [],
        direction_id: 0,
        headsign: "Forest Hills",
        headway_secs: 859.1,
        id: "v1",
        label: "v1-label",
        latitude: 0,
        longitude: 0,
        operator_id: "op1",
        operator_name: "SMITH",
        previous_vehicle_id: "v2",
        route_id: "39",
        route_status: "on_route",
        run_id: "run-1",
        // Early
        schedule_adherence_secs: -61,
        schedule_adherence_string: "0.0 sec (ontime)",
        scheduled_headway_secs: 120,
        scheduled_location: null,
        sources: ["swiftly"],
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
      {
        bearing: 33,
        block_id: "block-1",
        data_discrepancies: [],
        direction_id: 0,
        headsign: "Forest Hills",
        headway_secs: 859.1,
        id: "v1",
        label: "v1-label",
        latitude: 0,
        longitude: 0,
        operator_id: "op1",
        operator_name: "SMITH",
        previous_vehicle_id: "v2",
        route_id: "39",
        route_status: "on_route",
        run_id: "run-1",
        // Late
        schedule_adherence_secs: 361,
        schedule_adherence_string: "0.0 sec (ontime)",
        scheduled_headway_secs: 120,
        scheduled_location: null,
        sources: ["swiftly"],
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
    const vehiclesVaryingStatus: Vehicle[] = [
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
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "on-time",
        scheduledHeadwaySecs: 120,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
          stopId: "s1",
          stopName: "Stop Name",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.5,
          timepointId: "tp1",
        },
        scheduledLocation: null,
        routeStatus: "on_route",
      },
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
        previousVehicleId: "v2",
        scheduleAdherenceSecs: -61,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "early",
        scheduledHeadwaySecs: 120,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
          stopId: "s1",
          stopName: "Stop Name",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.5,
          timepointId: "tp1",
        },
        scheduledLocation: null,
        routeStatus: "on_route",
      },
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
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 361,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "late",
        scheduledHeadwaySecs: 120,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
          stopId: "s1",
          stopName: "Stop Name",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.5,
          timepointId: "tp1",
        },
        scheduledLocation: null,
        routeStatus: "on_route",
      },
    ]

    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.receive.mockImplementation((event, handler) => {
      if (event === "ok") {
        handler({ vehicles: vehiclesDataVaryingStatus })
      }
      return mockChannel
    })

    const { result } = renderHook(() =>
      useVehicles((mockSocket as any) as Socket, ["1"])
    )

    expect(result.current).toEqual({ "1": vehiclesVaryingStatus })
  })
})
