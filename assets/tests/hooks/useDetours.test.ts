import { describe, expect, test } from "@jest/globals"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import { act, renderHook } from "@testing-library/react"
import { simpleDetourFactory } from "../factories/detourListFactory"
import {
  useActiveDetours,
  useActiveDetoursByRoute,
  useDraftDetours,
  usePastDetours,
} from "../../src/hooks/useDetours"
import { SimpleDetour } from "../../src/models/detoursList"
import { RouteId } from "../../src/schedule"

const detourA = simpleDetourFactory.build()
const detourB = simpleDetourFactory.build()
const detourC = simpleDetourFactory.build()
const detourD = simpleDetourFactory.build()

const detours = [detourA, detourB, detourC]

describe("useActiveDetours", () => {
  test("parses initial detours message from joining a channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })
    mockSocket.channel.mockImplementation(() => mockChannel)
    const { result } = renderHook(() => useActiveDetours(mockSocket))

    expect(result.current).toStrictEqual({
      [detourA.id]: detourA,
      [detourB.id]: detourB,
      [detourC.id]: detourC,
    })
  })

  test("parses an activated detour event", async () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })

    const mockEvents: Record<
      string,
      undefined | ((data: { data: SimpleDetour }) => void)
    > = {
      activated: undefined,
    }
    mockChannel.on.mockImplementation((event, fn) => {
      mockEvents[event] = fn
      return 1
    })

    mockSocket.channel.mockImplementation(() => mockChannel)

    const { result } = renderHook(() => useActiveDetours(mockSocket))

    act(() => mockEvents["activated"]?.({ data: detourD }))

    expect(result.current).toStrictEqual({
      [detourA.id]: detourA,
      [detourB.id]: detourB,
      [detourC.id]: detourC,
      [detourD.id]: detourD,
    })
  })

  test("parses a deactivated detour event", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })

    const mockEvents: Record<
      string,
      undefined | ((data: { data: SimpleDetour }) => void)
    > = {
      deactivated: undefined,
    }
    mockChannel.on.mockImplementation((event, fn) => {
      mockEvents[event] = fn
      return 1
    })

    mockSocket.channel.mockImplementation(() => mockChannel)

    const { result } = renderHook(() => useActiveDetours(mockSocket))

    act(() => mockEvents["deactivated"]?.({ data: detourA }))

    expect(result.current).toStrictEqual({
      [detourB.id]: detourB,
      [detourC.id]: detourC,
    })
  })
})

describe("usePastDetours", () => {
  test("parses initial detours message", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })
    mockSocket.channel.mockImplementation(() => mockChannel)
    const { result } = renderHook(() => usePastDetours(mockSocket))

    expect(result.current).toStrictEqual({
      [detourA.id]: detourA,
      [detourB.id]: detourB,
      [detourC.id]: detourC,
    })
  })

  test("parses a deactivated detour event", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })

    const mockEvents: Record<
      string,
      undefined | ((data: { data: SimpleDetour }) => void)
    > = {
      deactivated: undefined,
    }
    mockChannel.on.mockImplementation((event, fn) => {
      mockEvents[event] = fn
      return 1
    })

    mockSocket.channel.mockImplementation(() => mockChannel)

    const { result } = renderHook(() => usePastDetours(mockSocket))

    act(() => mockEvents["deactivated"]?.({ data: detourD }))

    expect(result.current).toStrictEqual({
      [detourA.id]: detourA,
      [detourB.id]: detourB,
      [detourC.id]: detourC,
      [detourD.id]: detourD,
    })
  })
})

describe("useDraftDetours", () => {
  test("parses initial detours message", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })
    mockSocket.channel.mockImplementation(() => mockChannel)
    const { result } = renderHook(() => useDraftDetours(mockSocket))

    expect(result.current).toStrictEqual({
      [detourA.id]: detourA,
      [detourB.id]: detourB,
      [detourC.id]: detourC,
    })
  })

  test("parses a drafted detour event", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })

    const mockEvents: Record<
      string,
      undefined | ((data: { data: SimpleDetour }) => void)
    > = {
      drafted: undefined,
    }
    mockChannel.on.mockImplementation((event, fn) => {
      mockEvents[event] = fn
      return 1
    })

    mockSocket.channel.mockImplementation(() => mockChannel)

    const { result } = renderHook(() => useDraftDetours(mockSocket))

    act(() => mockEvents["drafted"]?.({ data: detourD }))

    expect(result.current).toStrictEqual({
      [detourA.id]: detourA,
      [detourB.id]: detourB,
      [detourC.id]: detourC,
      [detourD.id]: detourD,
    })
  })

  test("parses an activated detour event", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })

    const mockEvents: Record<
      string,
      undefined | ((data: { data: SimpleDetour }) => void)
    > = {
      activated: undefined,
    }
    mockChannel.on.mockImplementation((event, fn) => {
      mockEvents[event] = fn
      return 1
    })

    mockSocket.channel.mockImplementation(() => mockChannel)

    const { result } = renderHook(() => useDraftDetours(mockSocket))

    act(() => mockEvents["activated"]?.({ data: detourA }))

    expect(result.current).toStrictEqual({
      [detourB.id]: detourB,
      [detourC.id]: detourC,
    })
  })
})

// Not totally comprehensive, but was having difficulty mocking both initial results
// from joining a channel and results pushed to a channel at the same time
describe("useActiveDetoursByRoute", () => {
  test("selecting a new route subscribes to the new channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementation(() => mockChannel)

    const { rerender } = renderHook(() =>
      useActiveDetoursByRoute(mockSocket, ["1", "2"])
    )

    // Needs to be kicked to do the effects again after the socket initializes
    rerender()

    expect(mockSocket.channel).toHaveBeenCalledTimes(2)
    expect(mockSocket.channel).toHaveBeenCalledWith("detours:active:1")
    expect(mockSocket.channel).toHaveBeenCalledWith("detours:active:2")
    expect(mockChannel.join).toHaveBeenCalledTimes(2)
  })

  test("unselecting a route unsubscribes from the channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementation(() => mockChannel)

    const { rerender } = renderHook(
      (selectedRouteIds: RouteId[]) =>
        useActiveDetoursByRoute(mockSocket, selectedRouteIds),
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
        handler({ data: detours })
      }
      return mockChannel
    })

    const { result } = renderHook(() =>
      useActiveDetoursByRoute(mockSocket, ["1"])
    )

    expect(result.current).toEqual({
      "1": {
        [detourA.id]: detourA,
        [detourB.id]: detourB,
        [detourC.id]: detourC,
      },
    })
  })

  test("returns results pushed to the channel", async () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementation(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "activated") {
        handler({ data: detourD })
      }
      return 1
    })

    const { result } = renderHook(() =>
      useActiveDetoursByRoute(mockSocket, ["1"])
    )

    expect(result.current).toEqual({
      "1": {
        [detourD.id]: detourD,
      },
    })
  })
})
