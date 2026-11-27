import {
  jest,
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals"
import { replaceLocation, reset } from "jest-location-mock/hooks/jest"
import type { Socket } from "phoenix"
import {
  isReloadInFlight,
  registerSocket,
  reload,
  resetBrowserReloadState,
  unregisterSocket,
} from "../../src/models/browser"

const makePendingSocket = () => {
  let onDisconnected: (() => void | Promise<void>) | undefined
  const socket = {
    disconnect: jest.fn<Socket["disconnect"]>((callback) => {
      onDisconnected = callback
    }),
  }

  return {
    socket,
    finishDisconnect: () => {
      void onDisconnected?.()
    },
  }
}

describe("reload", () => {
  let reloadSpy: jest.Spied<() => void>

  beforeEach(() => {
    replaceLocation()
    reloadSpy = jest.spyOn(window.location, "reload")
  })

  afterEach(() => {
    resetBrowserReloadState()
    jest.useRealTimers()
    reset()
  })

  test("reloads immediately when no socket is registered and keeps reloadInFlight true", () => {
    reload()
    reload()

    expect(reloadSpy).toHaveBeenCalledTimes(1)
    expect(isReloadInFlight()).toBe(true)

    resetBrowserReloadState()
    expect(isReloadInFlight()).toBe(false)

    reload()
    expect(reloadSpy).toHaveBeenCalledTimes(2)
  })

  test("resets reloadInFlight when window.location.reload throws synchronously", () => {
    reloadSpy.mockImplementationOnce(() => {
      throw new Error("navigation blocked")
    })

    expect(() => reload()).toThrow("navigation blocked")
    expect(isReloadInFlight()).toBe(false)

    reload()
    expect(reloadSpy).toHaveBeenCalledTimes(2)
    expect(isReloadInFlight()).toBe(true)
  })

  test("waits for socket.disconnect callback with code 1000 before reloading", () => {
    const { socket, finishDisconnect } = makePendingSocket()
    registerSocket(socket)

    reload()

    expect(socket.disconnect).toHaveBeenCalledTimes(1)
    expect(socket.disconnect).toHaveBeenCalledWith(expect.any(Function), 1000)
    expect(isReloadInFlight()).toBe(true)
    expect(reloadSpy).not.toHaveBeenCalled()

    finishDisconnect()

    expect(reloadSpy).toHaveBeenCalledTimes(1)
    expect(isReloadInFlight()).toBe(true)
  })

  test("deduplicates concurrent and post-reload calls while reload remains in flight", () => {
    const { socket, finishDisconnect } = makePendingSocket()
    registerSocket(socket)

    reload()
    reload()

    expect(socket.disconnect).toHaveBeenCalledTimes(1)
    expect(reloadSpy).not.toHaveBeenCalled()

    finishDisconnect()
    reload()

    expect(socket.disconnect).toHaveBeenCalledTimes(1)
    expect(reloadSpy).toHaveBeenCalledTimes(1)
    expect(isReloadInFlight()).toBe(true)
  })

  test("waits for all active sockets to disconnect and ignores unregistered sockets", () => {
    const first = makePendingSocket()
    const second = makePendingSocket()
    const removed = makePendingSocket()

    registerSocket(first.socket)
    registerSocket(second.socket)
    registerSocket(removed.socket)
    unregisterSocket(removed.socket)

    reload()

    expect(removed.socket.disconnect).not.toHaveBeenCalled()
    expect(first.socket.disconnect).toHaveBeenCalledWith(
      expect.any(Function),
      1000
    )
    expect(second.socket.disconnect).toHaveBeenCalledWith(
      expect.any(Function),
      1000
    )

    first.finishDisconnect()
    expect(reloadSpy).not.toHaveBeenCalled()

    second.finishDisconnect()
    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })

  test("continues tearing down remaining sockets without stalling when socket.disconnect throws", () => {
    const throwingSocket = {
      disconnect: jest.fn<Socket["disconnect"]>(() => {
        throw new Error("disconnect failed")
      }),
    }
    const callThenThrowSocket = {
      disconnect: jest.fn<Socket["disconnect"]>((callback) => {
        void callback?.()
        throw new Error("post-callback failure")
      }),
    }
    const healthy = makePendingSocket()

    registerSocket(throwingSocket)
    registerSocket(callThenThrowSocket)
    registerSocket(healthy.socket)

    reload()

    expect(throwingSocket.disconnect).toHaveBeenCalledWith(
      expect.any(Function),
      1000
    )
    expect(callThenThrowSocket.disconnect).toHaveBeenCalledWith(
      expect.any(Function),
      1000
    )
    expect(healthy.socket.disconnect).toHaveBeenCalledWith(
      expect.any(Function),
      1000
    )
    expect(reloadSpy).not.toHaveBeenCalled()

    healthy.finishDisconnect()
    expect(reloadSpy).toHaveBeenCalledTimes(1)
    expect(isReloadInFlight()).toBe(true)

    resetBrowserReloadState()
    registerSocket(throwingSocket)

    reload()
    expect(reloadSpy).toHaveBeenCalledTimes(2)
    expect(isReloadInFlight()).toBe(true)
  })

  test("falls back to reloading after 1000ms when socket disconnect stalls and keeps reloadInFlight true", () => {
    jest.useFakeTimers()
    const { socket, finishDisconnect } = makePendingSocket()
    registerSocket(socket)

    reload()

    expect(socket.disconnect).toHaveBeenCalledWith(expect.any(Function), 1000)
    jest.advanceTimersByTime(999)
    expect(reloadSpy).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(reloadSpy).toHaveBeenCalledTimes(1)
    expect(isReloadInFlight()).toBe(true)

    finishDisconnect()
    reload()
    expect(reloadSpy).toHaveBeenCalledTimes(1)
    expect(isReloadInFlight()).toBe(true)
  })
})
