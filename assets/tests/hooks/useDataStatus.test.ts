import { renderHook } from "@testing-library/react-hooks"
import useDataStatus from "../../src/hooks/useDataStatus"
import * as browser from "../../src/models/browser"
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

  test("console.error on join error", async () => {
    const spyConsoleError = jest.spyOn(console, "error")
    spyConsoleError.mockImplementationOnce(msg => msg)
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("error")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() => useDataStatus(mockSocket))

    expect(spyConsoleError).toHaveBeenCalledWith("join failed", "ERROR_REASON")
    spyConsoleError.mockRestore()
  })

  test("reloads the window on channel timeout", async () => {
    const reloadSpy = jest.spyOn(browser, "reload")
    reloadSpy.mockImplementationOnce(() => ({}))
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("timeout")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() => useDataStatus(mockSocket))

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })
})
