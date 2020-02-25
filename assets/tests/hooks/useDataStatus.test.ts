import { renderHook } from "@testing-library/react-hooks"
import useDataStatus from "../../src/hooks/useDataStatus"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"

// tslint:disable: react-hooks-nesting

describe("useDataStatus", () => {
  test("returns good while loading", () => {
    const { result } = renderHook(() => useDataStatus(undefined))
    expect(result.current).toEqual("good")
  })

  test("subscribes to the data_status channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { rerender } = renderHook(() => useDataStatus(mockSocket))

    // Needs to be kicked to do the effects again after the socket initializes
    rerender()

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockSocket.channel).toHaveBeenCalledWith("data_status")
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("returns the data_status when pushed", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "data_status") {
        handler({ data: "outage" })
      }
    })

    const { result } = renderHook(() => useDataStatus(mockSocket))

    expect(result.current).toEqual("outage")
  })
})
