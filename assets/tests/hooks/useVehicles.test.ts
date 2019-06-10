import { Socket } from "phoenix"
import { renderHook } from "react-hooks-testing-library"
import useVehicles from "../../src/hooks/useVehicles"
import { RouteId } from "../../src/skate"

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
      id: "v1",
      label: "v1-label",
      run_id: "run-1",
      timestamp: 123,
      latitude: 0,
      longitude: 0,
      direction_id: 0,
      route_id: "39",
      trip_id: "t1",
      headsign: "Forest Hills",
      via_variant: "X",
      operator_id: "op1",
      operator_name: "SMITH",
      speed: 50.0,
      bearing: 33,
      block_id: "block-1",
      headway_secs: 859.1,
      previous_vehicle_id: "v2",
      schedule_adherence_secs: 0,
      schedule_adherence_string: "0.0 sec (ontime)",
      scheduled_headway_secs: 120,
      stop_status: {
        status: "in_transit_to",
        stop_id: "s1",
        stop_name: "Stop Name",
      },
      timepoint_status: {
        timepoint_id: "tp1",
        fraction_until_timepoint: 0.5,
      },
      scheduled_timepoint_status: null,
      route_status: "on_route",
    },
  ]
  const vehicles = [
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
      speed: 50.0,
      bearing: 33,
      blockId: "block-1",
      headwaySecs: 859.1,
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      scheduleAdherenceString: "0.0 sec (ontime)",
      scheduleAdherenceStatus: "on-time",
      scheduledHeadwaySecs: 120,
      stopStatus: {
        status: "in_transit_to",
        stopId: "s1",
        stopName: "Stop Name",
      },
      timepointStatus: {
        timepointId: "tp1",
        fractionUntilTimepoint: 0.5,
      },
      scheduledTimepointStatus: null,
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
})
