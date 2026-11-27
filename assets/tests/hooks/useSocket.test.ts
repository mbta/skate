import { jest, describe, test, expect, afterEach } from "@jest/globals"
import { renderHook } from "@testing-library/react"
import { replaceLocation, reset } from "jest-location-mock/hooks/jest"
import { act } from "react"
import { Socket } from "phoenix"
import useSocket, {
  ConnectionStatus,
  readUserToken,
} from "../../src/hooks/useSocket"
import { reload, resetBrowserReloadState } from "../../src/models/browser"

jest.mock("@sentry/react", () => ({
  __esModule: true,
  captureMessage: jest.fn(),
}))

jest.mock("phoenix", () => ({
  Socket: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    onOpen: jest.fn(),
    onClose: jest.fn(),
  })),
  __esModule: true,
}))

describe("useSocket", () => {
  afterEach(() => {
    resetBrowserReloadState()
    jest.useRealTimers()
    reset()
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

  test("registers socket for reload teardown and suppresses Disconnected status across reload timeout", () => {
    jest.useFakeTimers()
    replaceLocation()
    const reloadSpy = jest.spyOn(window.location, "reload")
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

    reload()
    expect(mockSocket.disconnect).toHaveBeenCalledWith(
      expect.any(Function),
      1000
    )

    act(() => {
      onCloseHandler({
        code: 1000,
        reason: "",
        wasClean: true,
      } as CloseEvent)
    })
    expect(result.current.connectionStatus).toEqual(ConnectionStatus.Connected)
    expect(reloadSpy).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1000)
    expect(reloadSpy).toHaveBeenCalledTimes(1)

    act(() => {
      onCloseHandler({
        code: 1006,
        reason: "",
        wasClean: false,
      } as CloseEvent)
    })
    expect(result.current.connectionStatus).toEqual(ConnectionStatus.Connected)
  })

  test("unregisters previous socket, disconnects with code 1000, and ignores its callbacks when userToken changes", () => {
    replaceLocation()
    let currentToken = "token-1"
    const getElementByIdSpy = jest
      .spyOn(document, "getElementById")
      .mockImplementation(
        () =>
          ({ dataset: { userToken: currentToken } }) as unknown as HTMLElement
      )

    try {
      const { result, rerender } = renderHook(() => useSocket())
      const firstSocket = result.current.socket!
      const [[firstOnOpen]] = (
        firstSocket.onOpen as jest.Mock<Socket["onOpen"]>
      ).mock.calls
      const [[firstOnClose]] = (
        firstSocket.onClose as jest.Mock<Socket["onClose"]>
      ).mock.calls

      currentToken = "token-2"
      rerender()

      const secondSocket = result.current.socket!
      expect(secondSocket).not.toBe(firstSocket)
      expect(firstSocket.disconnect).toHaveBeenCalledTimes(1)
      expect(firstSocket.disconnect).toHaveBeenCalledWith(undefined, 1000)

      act(() => {
        firstOnOpen()
      })
      expect(result.current.connectionStatus).toEqual(ConnectionStatus.Loading)

      const [[secondOnOpen]] = (
        secondSocket.onOpen as jest.Mock<Socket["onOpen"]>
      ).mock.calls
      act(() => {
        secondOnOpen()
      })
      expect(result.current.connectionStatus).toEqual(
        ConnectionStatus.Connected
      )

      act(() => {
        firstOnClose({
          code: 1000,
          reason: "",
          wasClean: true,
        } as CloseEvent)
      })
      expect(result.current.connectionStatus).toEqual(
        ConnectionStatus.Connected
      )

      reload()
      expect(firstSocket.disconnect).toHaveBeenCalledTimes(1)
      expect(secondSocket.disconnect).toHaveBeenCalledWith(
        expect.any(Function),
        1000
      )
      const [[reloadDisconnectCallback]] = (
        secondSocket.disconnect as jest.Mock<Socket["disconnect"]>
      ).mock.calls
      void reloadDisconnectCallback?.()
    } finally {
      getElementByIdSpy.mockRestore()
    }
  })

  test("unregisters socket and disconnects with code 1000 on unmount", () => {
    replaceLocation()
    const reloadSpy = jest.spyOn(window.location, "reload")
    const { result, unmount } = renderHook(() => useSocket())
    const mockSocket = result.current.socket!

    unmount()

    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1)
    expect(mockSocket.disconnect).toHaveBeenCalledWith(undefined, 1000)

    reload()
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1)
    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })
})

test("reads the user token from the page", () => {
  const getElementByIdSpy = jest
    .spyOn(document, "getElementById")
    .mockReturnValue({
      dataset: {
        userToken: "mock-token",
      },
    } as unknown as HTMLElement)

  try {
    expect(readUserToken()).toEqual("mock-token")
  } finally {
    getElementByIdSpy.mockRestore()
  }
})
