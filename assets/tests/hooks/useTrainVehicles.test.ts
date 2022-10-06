import { renderHook } from "@testing-library/react"
import useTrainVehicles, {
  TrainVehicleData,
} from "../../src/hooks/useTrainVehicles"
import * as browser from "../../src/models/browser"
import { TrainVehicle } from "../../src/realtime"
import { RouteId } from "../../src/schedule"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"

describe("useTrainVehicles", () => {
  const trainVehiclesData: TrainVehicleData[] = [
    {
      id: "R-5463D2D3",
      latitude: 42.24615,
      longitude: -71.00369,
      bearing: 15,
    },
  ]
  const trainVehicles: TrainVehicle[] = [
    {
      id: "R-5463D2D3",
      latitude: 42.24615,
      longitude: -71.00369,
      bearing: 15,
    },
  ]

  test("trainVehicles is empty to start", () => {
    const { result } = renderHook(() => useTrainVehicles(undefined, []))
    expect(result.current).toEqual({})
  })

  test("selecting a new route subscribes to the new channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { rerender } = renderHook(() => useTrainVehicles(mockSocket, ["Red"]))

    // Needs to be kicked to do the effects again after the socket initializes
    rerender()

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockSocket.channel).toHaveBeenCalledWith("train_vehicles:Red")
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("unselecting a route unsubscribes from the channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { rerender } = renderHook(
      (selectedRouteIds: RouteId[]) =>
        useTrainVehicles(mockSocket, selectedRouteIds),
      { initialProps: ["Red"] }
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
        handler({ data: trainVehiclesData })
      }
      return mockChannel
    })

    const { result } = renderHook(() => useTrainVehicles(mockSocket, ["Red"]))

    expect(result.current).toEqual({
      Red: trainVehicles,
    })
  })

  test("returns results from the initial join", async () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: trainVehiclesData })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() => useTrainVehicles(mockSocket, ["Red"]))

    expect(result.current).toEqual({
      Red: trainVehicles,
    })
  })

  test("returns results pushed to the channel", async () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "train_vehicles") {
        handler({ data: trainVehiclesData })
      }
    })

    const { result } = renderHook(() => useTrainVehicles(mockSocket, ["Red"]))

    expect(result.current).toEqual({
      Red: trainVehicles,
    })
  })

  test("reloads the window on channel timeout", async () => {
    const reloadSpy = jest.spyOn(browser, "reload")
    reloadSpy.mockImplementationOnce(() => ({}))
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("timeout")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() => useTrainVehicles(mockSocket, ["Red"]))

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })
})
