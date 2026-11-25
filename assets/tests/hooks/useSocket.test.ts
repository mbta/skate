import { afterEach, jest, describe, test, expect } from "@jest/globals"
import { renderHook } from "@testing-library/react"
import { act } from "react"
import { Socket } from "phoenix"
import useSocket, {
  ConnectionStatus,
  readUserToken,
} from "../../src/hooks/useSocket"
import {
  disconnectAndReload,
  NORMAL_SOCKET_CLOSE_CODE,
} from "../../src/helpers/socketLifecycle"
import * as browser from "../../src/models/browser"

jest.mock("@sentry/react", () => ({
  __esModule: true,
  captureMessage: jest.fn(),
}))

jest.mock("phoenix", () => ({
  Socket: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn((callback?: () => void) => {
      callback?.()
    }),
    onOpen: jest.fn(),
    onClose: jest.fn(),
  })),
  __esModule: true,
}))

describe("useSocket", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test("initially returns a loading socket", () => {
    const { result } = renderHook(() => useSocket())
    const mockSocket = result.current.socket
    expect(mockSocket).toBeDefined()
    expect(mockSocket!.connect).toHaveBeenCalled()
    expect(result.current.connectionStatus).toEqual(ConnectionStatus.Loading)
  })

  test("connectionStatus is set to Connected when the socket connects", () => {
    const { result } = renderHook(() => useSocket())
    const mockSocket = result.current.socket
    const [[onOpenHandler]] = (
      mockSocket!.onOpen as jest.Mock<Socket["onOpen"]>
    ).mock.calls
    act(() => {
      onOpenHandler()
    })
    expect(result.current.connectionStatus).toEqual(ConnectionStatus.Connected)
  })

  test("connectionStatus is set to Disconnected when the socket closes", () => {
    const { result } = renderHook(() => useSocket())
    const mockSocket = result.current.socket
    const [[onCloseHandler]] = (
      mockSocket!.onClose as jest.Mock<Socket["onClose"]>
    ).mock.calls
    act(() => {
      onCloseHandler({
        code: 500,
        reason: "some reason",
        wasClean: false,
      } as CloseEvent)
    })
    expect(result.current.connectionStatus).toEqual(
      ConnectionStatus.Disconnected
    )
  })

  test("disconnects with code 1000 and unregisters active socket on unmount", () => {
    const reloadSpy = jest.spyOn(browser, "reload").mockImplementation(() => {})
    const { result, unmount } = renderHook(() => useSocket())
    const mockSocket = result.current.socket!

    let disconnectCallback: (() => void) | undefined
    ;(
      mockSocket.disconnect as jest.Mock<Socket["disconnect"]>
    ).mockImplementationOnce((callback) => {
      disconnectCallback = callback
    })

    disconnectAndReload()
    expect(mockSocket.disconnect).toHaveBeenCalledWith(
      expect.any(Function),
      NORMAL_SOCKET_CLOSE_CODE
    )
    expect(reloadSpy).not.toHaveBeenCalled()

    disconnectCallback?.()
    expect(reloadSpy).toHaveBeenCalledTimes(1)

    unmount()
    expect(mockSocket.disconnect).toHaveBeenLastCalledWith(
      undefined,
      NORMAL_SOCKET_CLOSE_CODE
    )

    // After unmount, disconnectAndReload falls back directly to browser.reload
    ;(mockSocket.disconnect as jest.Mock).mockClear()
    disconnectAndReload()
    expect(mockSocket.disconnect).not.toHaveBeenCalled()
    expect(reloadSpy).toHaveBeenCalledTimes(2)
  })

  test("does not transition connectionStatus to Disconnected when onClose fires while disconnectAndReload is in flight", () => {
    const reloadSpy = jest.spyOn(browser, "reload").mockImplementation(() => {})
    const { result } = renderHook(() => useSocket())
    const mockSocket = result.current.socket!

    const [[onOpenHandler]] = (mockSocket.onOpen as jest.Mock<Socket["onOpen"]>)
      .mock.calls
    const [[onCloseHandler]] = (
      mockSocket.onClose as jest.Mock<Socket["onClose"]>
    ).mock.calls

    act(() => {
      onOpenHandler()
    })
    expect(result.current.connectionStatus).toEqual(ConnectionStatus.Connected)

    let disconnectCallback: (() => void) | undefined
    ;(
      mockSocket.disconnect as jest.Mock<Socket["disconnect"]>
    ).mockImplementationOnce((callback) => {
      disconnectCallback = callback
    })

    disconnectAndReload(mockSocket)

    act(() => {
      onCloseHandler({
        code: NORMAL_SOCKET_CLOSE_CODE,
        reason: "Normal closure",
        wasClean: true,
      } as CloseEvent)
    })

    expect(result.current.connectionStatus).toEqual(ConnectionStatus.Connected)
    expect(reloadSpy).not.toHaveBeenCalled()

    disconnectCallback?.()
    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })
})

test("reads the user token from the page", () => {
  const mockElement = {
    dataset: {
      userToken: "mock-token",
    },
  }
  // @ts-ignore
  document.getElementById = () => mockElement

  expect(readUserToken()).toEqual("mock-token")
})
