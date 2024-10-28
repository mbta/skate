import { describe, test, expect } from "@jest/globals"
import { renderHook } from "@testing-library/react"
import useDataStatus from "../../src/hooks/useDataStatus"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"

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

  test("returns the resulting data_status", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: "outage" })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() => useDataStatus(mockSocket))

    expect(result.current).toEqual("outage")
  })
})
