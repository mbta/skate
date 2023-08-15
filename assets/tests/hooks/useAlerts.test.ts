import { jest, describe, test, expect } from "@jest/globals"
import { renderHook } from "@testing-library/react"
import useAlerts from "../../src/hooks/useAlerts"
import * as browser from "../../src/models/browser"
import { RouteId } from "../../src/schedule.d"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"

describe("useAlerts", () => {
  test("alerts is empty to start with", () => {
    const { result } = renderHook(() => useAlerts(undefined, []))
    expect(result.current).toEqual({})
  })

  test("selecting a new route subscribes to the new channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementation(() => mockChannel)

    const { rerender } = renderHook(() => useAlerts(mockSocket, ["1"]))

    // Needs to be kicked to do the effects again after the socket initializes
    rerender()

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockSocket.channel).toHaveBeenCalledWith("alerts:route:1")
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("unselecting a route unsubscribes from the channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementation(() => mockChannel)

    const { rerender } = renderHook(
      (selectedRouteIds: RouteId[]) => useAlerts(mockSocket, selectedRouteIds),
      { initialProps: ["1", "2"] }
    )
    rerender(["1"]) // Deselect the route

    expect(mockChannel.leave).toHaveBeenCalledTimes(1)
  })

  test("returns results from joining a channel", async () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementation(() => mockChannel)
    mockChannel.receive.mockImplementation((event, handler) => {
      if (event === "ok") {
        handler({ data: ["alert text"] })
      }
      return mockChannel
    })

    const { result } = renderHook(() => useAlerts(mockSocket, ["1"]))

    expect(result.current).toEqual({
      "1": ["alert text"],
    })
  })

  test("returns results pushed to the channel", async () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementation(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "alerts") {
        handler({ data: ["alert text"] })
      }
      return 1
    })

    const { result } = renderHook(() => useAlerts(mockSocket, ["1"]))

    expect(result.current).toEqual({
      "1": ["alert text"],
    })
  })

  test("reloads the window on channel timeout", async () => {
    const reloadSpy = jest.spyOn(browser, "reload")
    reloadSpy.mockImplementation(() => ({}))
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("timeout")
    mockSocket.channel.mockImplementation(() => mockChannel)

    renderHook(() => useAlerts(mockSocket, ["1"]))

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })
})
