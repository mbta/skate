import { describe, expect, test } from "@jest/globals"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import { act, renderHook } from "@testing-library/react"
import { simpleDetourDataFactory } from "../factories/detourListFactory"
import {
  useActiveDetours,
  useActiveDetoursByRoute,
  useDraftDetours,
  usePastDetours,
} from "../../src/hooks/useDetours"
import {
  SimpleDetourData,
  simpleDetourFromData,
} from "../../src/models/detoursList"
import { RouteId } from "../../src/schedule"

const detourA = simpleDetourDataFactory.build()
const detourB = simpleDetourDataFactory.build()
const detourC = simpleDetourDataFactory.build()
const detourD = simpleDetourDataFactory.build()

const parsedDetourA = simpleDetourFromData(detourA)
const parsedDetourB = simpleDetourFromData(detourB)
const parsedDetourC = simpleDetourFromData(detourC)
const parsedDetourD = simpleDetourFromData(detourD)

const detours = [detourA, detourB, detourC]

describe("useActiveDetours", () => {
  test("parses initial detours message from joining a channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })
    mockSocket.channel.mockImplementation(() => mockChannel)
    const { result } = renderHook(() => useActiveDetours(mockSocket))

    expect(result.current).toStrictEqual({
      [detourA.id]: parsedDetourA,
      [detourB.id]: parsedDetourB,
      [detourC.id]: parsedDetourC,
    })
  })

  test("parses an activated detour event", async () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })

    const mockEvents: Record<
      string,
      undefined | ((data: { data: SimpleDetourData }) => void)
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
      [detourA.id]: parsedDetourA,
      [detourB.id]: parsedDetourB,
      [detourC.id]: parsedDetourC,
      [detourD.id]: parsedDetourD,
    })
  })

  test("parses a deactivated detour event", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })

    const mockEvents: Record<
      string,
      undefined | ((data: { data: SimpleDetourData }) => void)
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
      [detourB.id]: parsedDetourB,
      [detourC.id]: parsedDetourC,
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
      [detourA.id]: parsedDetourA,
      [detourB.id]: parsedDetourB,
      [detourC.id]: parsedDetourC,
    })
  })

  test("parses a deactivated detour event", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })

    const mockEvents: Record<
      string,
      undefined | ((data: { data: SimpleDetourData }) => void)
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
      [detourA.id]: parsedDetourA,
      [detourB.id]: parsedDetourB,
      [detourC.id]: parsedDetourC,
      [detourD.id]: parsedDetourD,
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
      [detourA.id]: parsedDetourA,
      [detourB.id]: parsedDetourB,
      [detourC.id]: parsedDetourC,
    })
  })

  test("parses a drafted detour event", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })

    const mockEvents: Record<
      string,
      undefined | ((data: { data: SimpleDetourData }) => void)
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
      [detourA.id]: parsedDetourA,
      [detourB.id]: parsedDetourB,
      [detourC.id]: parsedDetourC,
      [detourD.id]: parsedDetourD,
    })
  })

  test("parses an activated detour event", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })

    const mockEvents: Record<
      string,
      undefined | ((data: { data: SimpleDetourData }) => void)
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
      [detourB.id]: parsedDetourB,
      [detourC.id]: parsedDetourC,
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
        [detourA.id]: parsedDetourA,
        [detourB.id]: parsedDetourB,
        [detourC.id]: parsedDetourC,
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
        [detourD.id]: parsedDetourD,
      },
    })
  })
})
