import { jest, describe, test, expect } from "@jest/globals"
import { renderHook } from "@testing-library/react"
import { act } from "react"
import { Socket } from "phoenix"
import * as Sentry from "@sentry/react"
import useSocket, {
  ConnectionStatus,
  readUserToken,
} from "../../src/hooks/useSocket"

jest.mock("@sentry/react", () => ({
  __esModule: true,
  captureMessage: jest.fn(),
}))

jest.mock("phoenix", () => ({
  Socket: jest.fn(() => ({
    connect: jest.fn(),
    onOpen: jest.fn(),
    onError: jest.fn(),
    onClose: jest.fn(),
  })),
  __esModule: true,
}))

describe("useSocket", () => {
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

  test("connectionStatus is set to Disconnected when the socket closes and logs to Sentry", () => {
    const { result } = renderHook(() => useSocket())
    const mockSocket = result.current.socket
    const [[onCloseHandler]] = (
      mockSocket!.onClose as jest.Mock<Socket["onClose"]>
    ).mock.calls
    act(() => {
      onCloseHandler({
        code: 1006,
        reason: "abnormal closure",
        wasClean: false,
      } as CloseEvent)
    })
    expect(result.current.connectionStatus).toEqual(
      ConnectionStatus.Disconnected
    )
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining("WebSocket connection closed"),
      expect.objectContaining({
        level: "warning",
        extra: expect.objectContaining({
          code: 1006,
          reason: "abnormal closure",
          wasClean: false,
        }),
      })
    )
  })

  test("logs socket error to Sentry when socket onError is called", () => {
    const { result } = renderHook(() => useSocket())
    const mockSocket = result.current.socket
    const [[onErrorHandler]] = (
      mockSocket!.onError as jest.Mock<Socket["onError"]>
    ).mock.calls
    act(() => {
      ;(onErrorHandler as any)("network failed")
    })
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "WebSocket connection encountered an error",
      expect.objectContaining({
        level: "error",
        extra: expect.objectContaining({
          error: "network failed",
        }),
      })
    )
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
