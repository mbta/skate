import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals"
import { Socket } from "phoenix"
import {
  DISCONNECT_TIMEOUT_MS,
  disconnectAndReload,
  isReloadInFlight,
  NORMAL_SOCKET_CLOSE_CODE,
  registerSocket,
  resetSocketLifecycle,
  unregisterSocket,
} from "../../src/helpers/socketLifecycle"
import * as browser from "../../src/models/browser"
import { makeMockSocket } from "../testHelpers/socketHelpers"

describe("socketLifecycle", () => {
  let reloadSpy: jest.Spied<typeof browser.reload>

  beforeEach(() => {
    reloadSpy = jest.spyOn(browser, "reload").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.useRealTimers()
    resetSocketLifecycle()
    reloadSpy.mockRestore()
  })

  test("disconnects explicit socket with code 1000 and reloads only after callback fires", () => {
    const mockSocket = makeMockSocket()
    let onDisconnected: (() => void) | undefined
    mockSocket.disconnect.mockImplementation((callback) => {
      onDisconnected = callback
    })

    disconnectAndReload(mockSocket)

    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1)
    expect(mockSocket.disconnect).toHaveBeenCalledWith(
      expect.any(Function),
      NORMAL_SOCKET_CLOSE_CODE
    )
    expect(reloadSpy).not.toHaveBeenCalled()

    onDisconnected?.()

    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })

  test("deduplicates concurrent calls while teardown is in flight and resets guard before reload", () => {
    const mockSocket = makeMockSocket()
    let onDisconnected: (() => void) | undefined
    mockSocket.disconnect.mockImplementation((callback) => {
      onDisconnected = callback
    })

    disconnectAndReload(mockSocket)
    disconnectAndReload(mockSocket)
    disconnectAndReload()

    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1)
    expect(reloadSpy).not.toHaveBeenCalled()

    onDisconnected?.()

    expect(reloadSpy).toHaveBeenCalledTimes(1)

    // Subsequent calls after completion are not stuck in an in-flight state
    mockSocket.disconnect.mockImplementation((callback) => {
      callback?.()
    })
    disconnectAndReload(mockSocket)

    expect(mockSocket.disconnect).toHaveBeenCalledTimes(2)
    expect(reloadSpy).toHaveBeenCalledTimes(2)
  })

  test("falls back to active sockets registered via registerSocket and waits for all to disconnect", () => {
    const socketA = makeMockSocket()
    const socketB = makeMockSocket()
    let completeA: (() => void) | undefined
    let completeB: (() => void) | undefined
    socketA.disconnect.mockImplementation((callback) => {
      completeA = callback
    })
    socketB.disconnect.mockImplementation((callback) => {
      completeB = callback
    })

    registerSocket(socketA)
    registerSocket(socketB)

    disconnectAndReload()

    expect(socketA.disconnect).toHaveBeenCalledWith(
      expect.any(Function),
      NORMAL_SOCKET_CLOSE_CODE
    )
    expect(socketB.disconnect).toHaveBeenCalledWith(
      expect.any(Function),
      NORMAL_SOCKET_CLOSE_CODE
    )
    expect(reloadSpy).not.toHaveBeenCalled()

    completeA?.()
    expect(reloadSpy).not.toHaveBeenCalled()

    completeB?.()
    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })

  test("falls back immediately to browser.reload when no socket is active or socket lacks disconnect", () => {
    disconnectAndReload()
    expect(reloadSpy).toHaveBeenCalledTimes(1)

    const lightweightSocket = { channel: jest.fn() } as unknown as Socket
    disconnectAndReload(lightweightSocket)
    expect(reloadSpy).toHaveBeenCalledTimes(2)

    const registeredSocket = makeMockSocket()
    registerSocket(registeredSocket)
    unregisterSocket(registeredSocket)
    disconnectAndReload()
    expect(registeredSocket.disconnect).not.toHaveBeenCalled()
    expect(reloadSpy).toHaveBeenCalledTimes(3)
  })

  test("triggers browser.reload after DISCONNECT_TIMEOUT_MS and clears isReloadInFlight when socket.disconnect stalls", () => {
    jest.useFakeTimers()
    const stalledSocket = makeMockSocket()
    let lateCallback: (() => void) | undefined
    stalledSocket.disconnect.mockImplementation((callback) => {
      lateCallback = callback
    })

    disconnectAndReload(stalledSocket)

    expect(isReloadInFlight()).toBe(true)
    expect(reloadSpy).not.toHaveBeenCalled()

    jest.advanceTimersByTime(DISCONNECT_TIMEOUT_MS - 1)
    expect(isReloadInFlight()).toBe(true)
    expect(reloadSpy).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(isReloadInFlight()).toBe(false)
    expect(reloadSpy).toHaveBeenCalledTimes(1)

    // Late callback firing after timeout does not trigger a duplicate reload
    lateCallback?.()
    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })

  test("completes browser.reload and clears isReloadInFlight when socket.disconnect throws synchronously", () => {
    const throwingSocket = makeMockSocket()
    throwingSocket.disconnect.mockImplementation(() => {
      throw new Error("disconnect failed")
    })

    expect(() => disconnectAndReload(throwingSocket)).not.toThrow()
    expect(reloadSpy).toHaveBeenCalledTimes(1)
    expect(isReloadInFlight()).toBe(false)

    // Also does not wedge remaining count when paired with another active socket
    const healthySocket = makeMockSocket()
    let completeHealthy: (() => void) | undefined
    healthySocket.disconnect.mockImplementation((callback) => {
      completeHealthy = callback
    })
    registerSocket(throwingSocket)
    registerSocket(healthySocket)

    expect(() => disconnectAndReload()).not.toThrow()
    expect(isReloadInFlight()).toBe(true)
    expect(reloadSpy).toHaveBeenCalledTimes(1)

    completeHealthy?.()
    expect(isReloadInFlight()).toBe(false)
    expect(reloadSpy).toHaveBeenCalledTimes(2)
  })

  test("disconnects both registered activeSockets and an unregistered explicit socket before reloading", () => {
    const registeredSocket = makeMockSocket()
    const unregisteredSocket = makeMockSocket()
    let completeRegistered: (() => void) | undefined
    let completeUnregistered: (() => void) | undefined
    registeredSocket.disconnect.mockImplementation((callback) => {
      completeRegistered = callback
    })
    unregisteredSocket.disconnect.mockImplementation((callback) => {
      completeUnregistered = callback
    })

    registerSocket(registeredSocket)

    disconnectAndReload(unregisteredSocket)

    expect(registeredSocket.disconnect).toHaveBeenCalledTimes(1)
    expect(registeredSocket.disconnect).toHaveBeenCalledWith(
      expect.any(Function),
      NORMAL_SOCKET_CLOSE_CODE
    )
    expect(unregisteredSocket.disconnect).toHaveBeenCalledTimes(1)
    expect(unregisteredSocket.disconnect).toHaveBeenCalledWith(
      expect.any(Function),
      NORMAL_SOCKET_CLOSE_CODE
    )
    expect(reloadSpy).not.toHaveBeenCalled()

    completeRegistered?.()
    expect(reloadSpy).not.toHaveBeenCalled()

    completeUnregistered?.()
    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })
})
