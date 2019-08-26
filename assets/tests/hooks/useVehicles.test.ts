import { renderHook } from "@testing-library/react-hooks"
import { Socket } from "phoenix"
import useVehicles from "../../src/hooks/useVehicles"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Vehicle, VehicleTimepointStatus } from "../../src/realtime.d"
import { RouteId } from "../../src/schedule.d"

// tslint:disable: react-hooks-nesting
// tslint:disable: object-literal-sort-keys

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
        handler({
          on_route_vehicles: vehiclesData,
          incoming_vehicles: [],
        })
      }
      return mockChannel
    })

    const { result } = renderHook(() =>
      useVehicles((mockSocket as any) as Socket, ["1"])
    )

    expect(result.current).toEqual({
      "1": {
        onRouteVehicles: vehicles,
        incomingVehicles: [],
      },
    })
  })

  test("returns incoming vehicles", async () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.receive.mockImplementation((event, handler) => {
      if (event === "ok") {
        handler({
          on_route_vehicles: [],
          incoming_vehicles: vehiclesData,
        })
      }
      return mockChannel
    })

    const { result } = renderHook(() =>
      useVehicles((mockSocket as any) as Socket, ["1"])
    )

    const incomingVehicles = vehicles.map(vehicle => ({
      ...vehicle,
      isOnRoute: false,
    }))

    expect(result.current).toEqual({
      "1": {
        onRouteVehicles: [],
        incomingVehicles,
      },
    })
  })

  test("returns results pushed to the channel", async () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "vehicles") {
        handler({
          on_route_vehicles: vehiclesData,
          incoming_vehicles: [],
        })
      }
    })

    const { result } = renderHook(() =>
      useVehicles((mockSocket as any) as Socket, ["1"])
    )

    expect(result.current).toEqual({
      "1": {
        onRouteVehicles: vehicles,
        incomingVehicles: [],
      },
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
          on_route_vehicles: vehiclesDataVaryingHeadway,
          incoming_vehicles: [],
        })
      }
    })

    const { result } = renderHook(() =>
      useVehicles((mockSocket as any) as Socket, ["1"])
    )

    expect(result.current).toEqual({
      "1": {
        onRouteVehicles: expectedVehicles,
        incomingVehicles: [],
      },
    })
  })
})
