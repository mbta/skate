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
    const vehicles = [{ id: "y1000" }]
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.receive.mockImplementation((event, handler) => {
      if (event === "ok") {
        handler({ vehicles })
      }
      return mockChannel
    })

    const { result } = renderHook(() =>
      useVehicles((mockSocket as any) as Socket, ["1"])
    )

    expect(result.current).toEqual({ "1": vehicles })
  })

  test("returns results pushed to the channel", async () => {
    const vehicles = [{ id: "y1000" }]
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "vehicles") {
        handler({ vehicles })
      }
    })

    const { result } = renderHook(() =>
      useVehicles((mockSocket as any) as Socket, ["1"])
    )

    expect(result.current).toEqual({ "1": vehicles })
  })
})
