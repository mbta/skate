import { renderHook } from "@testing-library/react"
import useVehicles from "../../src/hooks/useVehicles"
import * as browser from "../../src/models/browser"
import {
  VehicleData,
  vehicleInScheduledServiceFromData,
} from "../../src/models/vehicleData"
import { Ghost, VehicleInScheduledService } from "../../src/realtime.d"
import { RouteId } from "../../src/schedule.d"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import ghostFactory from "../factories/ghost"
import vehicleDataFactory from "../factories/vehicle_data"
import ghostDataFactory from "../factories/ghost_data"

describe("useVehicles", () => {
  const vehicleData = vehicleDataFactory.build()
  const vehiclesData: VehicleData[] = [vehicleData]
  const vehicles: VehicleInScheduledService[] = [
    vehicleInScheduledServiceFromData(vehicleData),
  ]

  test("vehicles is empty to start with", () => {
    const { result } = renderHook(() => useVehicles(undefined, []))
    expect(result.current).toEqual({})
  })

  test("selecting a new route subscribes to the new channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { rerender } = renderHook(() => useVehicles(mockSocket, ["1"]))

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
        useVehicles(mockSocket, selectedRouteIds),
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

    const { result } = renderHook(() => useVehicles(mockSocket, ["1"]))

    expect(result.current).toEqual({
      "1": vehicles,
    })
  })

  test("returns ghost vehicles", async () => {
    const ghost: Ghost = ghostFactory.build({
      id: "ghost-trip",
      tripId: "a_trip",
      blockWaivers: [
        {
          startTime: new Date("2018-08-15T13:38:21.000Z"),
          endTime: new Date("2018-08-15T13:38:41.000Z"),
          causeId: 0,
          causeDescription: "Block Waiver",
          remark: null,
        },
      ],
      incomingTripDirectionId: 1,
    })

    const ghostData = ghostDataFactory.build({
      id: "ghost-trip",
      trip_id: "a_trip",
      block_waivers: [
        {
          start_time: 1_534_340_301,
          end_time: 1_534_340_321,
          cause_id: 0,
          cause_description: "Block Waiver",
          remark: null,
        },
      ],
      incoming_trip_direction_id: 1,
    })

    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.receive.mockImplementation((event, handler) => {
      if (event === "ok") {
        handler({ data: [ghostData] })
      }
      return mockChannel
    })

    const { result } = renderHook(() => useVehicles(mockSocket, ["1"]))

    expect(result.current).toEqual({
      "1": [ghost],
    })
  })

  test("returns results from the initial join", async () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: vehiclesData })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() => useVehicles(mockSocket, ["1"]))

    expect(result.current).toEqual({
      "1": vehicles,
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

    const { result } = renderHook(() => useVehicles(mockSocket, ["1"]))

    expect(result.current).toEqual({
      "1": vehicles,
    })
  })

  test("reloads the window on channel timeout", async () => {
    const reloadSpy = jest.spyOn(browser, "reload")
    reloadSpy.mockImplementationOnce(() => ({}))
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("timeout")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() => useVehicles(mockSocket, ["1"]))

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })
})
