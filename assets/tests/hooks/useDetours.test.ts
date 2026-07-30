import { describe, expect, test } from "@jest/globals"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import { renderHook } from "@testing-library/react"
import { act } from "react"
import {
  simpleActiveDetourDataFactory,
  simpleDetourDataFactory,
} from "../factories/detourListFactory"
import {
  useActiveDetours,
  useActiveDetoursByRoute,
  useDraftDetours,
  usePastDetours,
} from "../../src/hooks/useDetours"
import {
  SimpleActiveDetourData,
  SimpleDetourData,
  simpleDetourFromActiveData,
  simpleDetourFromData,
} from "../../src/models/detoursList"
import { RouteId } from "../../src/schedule"

describe("useActiveDetours", () => {
  const detourA = simpleActiveDetourDataFactory.build()
  const detourB = simpleActiveDetourDataFactory.build()
  const detourC = simpleActiveDetourDataFactory.build()
  const detourD = simpleActiveDetourDataFactory.build()

  const parsedDetourA = simpleDetourFromActiveData(detourA)
  const parsedDetourB = simpleDetourFromActiveData(detourB)
  const parsedDetourC = simpleDetourFromActiveData(detourC)
  const parsedDetourD = simpleDetourFromActiveData(detourD)

  const detours = [detourA, detourB, detourC]
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
      undefined | ((data: { data: SimpleActiveDetourData }) => void)
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

    act(() =>
      mockEvents["deactivated"]?.({
        data: simpleDetourDataFactory.build(detourA),
      })
    )

    expect(result.current).toStrictEqual({
      [detourB.id]: parsedDetourB,
      [detourC.id]: parsedDetourC,
    })
  })
})

describe("usePastDetours", () => {
  const detourA = simpleDetourDataFactory.build()
  const detourB = simpleDetourDataFactory.build()
  const detourC = simpleDetourDataFactory.build()
  const detourD = simpleDetourDataFactory.build()

  const parsedDetourA = simpleDetourFromData(detourA)
  const parsedDetourB = simpleDetourFromData(detourB)
  const parsedDetourC = simpleDetourFromData(detourC)
  const parsedDetourD = simpleDetourFromData(detourD)

  const detours = [detourA, detourB, detourC]
  test("parses initial detours message", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })
    mockSocket.channel.mockImplementation(() => mockChannel)
    const { result } = renderHook(() => usePastDetours({ socket: mockSocket }))

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

    const { result } = renderHook(() => usePastDetours({ socket: mockSocket }))

    act(() => mockEvents["deactivated"]?.({ data: detourD }))

    expect(result.current).toStrictEqual({
      [detourA.id]: parsedDetourA,
      [detourB.id]: parsedDetourB,
      [detourC.id]: parsedDetourC,
      [detourD.id]: parsedDetourD,
    })
  })

  test("parses initial detours message given a route", () => {
    const selectedRoute = parsedDetourA.route
    const mockSocket = makeMockSocket()
    // Filtering to a route occurs on the backend
    const mockChannel = makeMockChannel("ok", { data: [detourA] })
    mockSocket.channel.mockImplementation(() => mockChannel)
    const { result } = renderHook(() =>
      usePastDetours({ socket: mockSocket, routeId: selectedRoute })
    )

    // Still sets a result when provided a route
    expect(result.current).toStrictEqual({
      [detourA.id]: parsedDetourA,
    })
  })

  test("pushes pagination on initial join with offset derived from page number", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })
    mockSocket.channel.mockImplementation(() => mockChannel)

    renderHook(() =>
      usePastDetours({ socket: mockSocket, limit: 5, pageNumber: 3 })
    )

    expect(mockChannel.push).toHaveBeenCalledWith("paginate", {
      limit: 5,
      offset: 10,
    })
  })

  test("emits pagination metadata from paginate responses", () => {
    const onPaginate = jest.fn()
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", {
      data: detours,
      total_count: 20,
      total_pages: 4,
      page_number: 2,
      page_size: 5,
    })
    mockSocket.channel.mockImplementation(() => mockChannel)

    renderHook(() =>
      usePastDetours({ socket: mockSocket, limit: 5, pageNumber: 2, onPaginate })
    )

    expect(onPaginate).toHaveBeenCalledWith({
      totalCount: 20,
      totalPages: 4,
      pageNumber: 2,
      pageSize: 5,
    })
  })

  test("pushes pagination again when pageNumber changes", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })
    mockSocket.channel.mockImplementation(() => mockChannel)

    const { rerender } = renderHook(
      ({ socket, pageNumber }) =>
        usePastDetours({ socket, limit: 5, pageNumber }),
      { initialProps: { socket: mockSocket, pageNumber: 1 } }
    )

    expect(mockChannel.push).toHaveBeenCalledWith("paginate", {
      limit: 5,
      offset: 0,
    })

    rerender({ socket: mockSocket, pageNumber: 2 })

    expect(mockChannel.push).toHaveBeenLastCalledWith("paginate", {
      limit: 5,
      offset: 5,
    })
  })

  test("switches channels and paginates with page 1 equivalent offset when route changes", () => {
    const selectedRoute = parsedDetourA.route
    const mockSocket = makeMockSocket()
    const mockChannelA = makeMockChannel("ok", { data: detours })
    const mockChannelB = makeMockChannel("ok", { data: [detourA] })

    mockSocket.channel.mockImplementationOnce(() => mockChannelA)
    mockSocket.channel.mockImplementationOnce(() => mockChannelB)

    const { rerender } = renderHook(
      ({ socket, routeId, pageNumber }) =>
        usePastDetours({ socket, routeId, limit: 5, pageNumber }),
      {
        initialProps: { socket: mockSocket, routeId: "all", pageNumber: 5 },
      }
    )

    expect(mockChannelA.push).toHaveBeenCalledWith("paginate", {
      limit: 5,
      offset: 20,
    })

    rerender({ socket: mockSocket, routeId: selectedRoute, pageNumber: 1 })

    expect(mockChannelB.push).toHaveBeenCalledWith("paginate", {
      limit: 5,
      offset: 0,
    })
  })

  test("subscribes to a new channel by route when provided with a route", () => {
    const selectedRoute = parsedDetourA.route
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })
    const mockChannelByRoute = makeMockChannel("ok", { data: [detourA] })

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

    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockSocket.channel.mockImplementation(() => mockChannelByRoute)
    const { result, rerender } = renderHook((props) => usePastDetours(props), {
      initialProps: { socket: mockSocket, routeId: "all" },
    })

    act(() => mockEvents["deactivated"]?.({ data: detourD }))

    expect(result.current).toStrictEqual({
      [detourA.id]: parsedDetourA,
      [detourB.id]: parsedDetourB,
      [detourC.id]: parsedDetourC,
      [detourD.id]: parsedDetourD,
    })

    rerender({ socket: mockSocket, routeId: selectedRoute })

    const detourOnRoute = { ...detourD, route: detourA.route }
    act(() => mockEvents["deactivated"]?.({ data: detourOnRoute }))

    expect(result.current).toStrictEqual({
      [detourA.id]: parsedDetourA,
      [detourD.id]: { ...parsedDetourD, route: selectedRoute },
    })
  })
})

describe("useDraftDetours", () => {
  const detourA = simpleDetourDataFactory.build()
  const detourB = simpleDetourDataFactory.build()
  const detourC = simpleDetourDataFactory.build()
  const detourD = simpleDetourDataFactory.build()

  const parsedDetourA = simpleDetourFromData(detourA)
  const parsedDetourB = simpleDetourFromData(detourB)
  const parsedDetourC = simpleDetourFromData(detourC)
  const parsedDetourD = simpleDetourFromData(detourD)

  const detours = [detourA, detourB, detourC]
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
    const detours = simpleDetourDataFactory.buildList(3)
    const [detourA, detourB, detourC] = detours
    const [_, parsedDetourB, parsedDetourC] = detours.map(simpleDetourFromData)

    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: detours })

    const mockEvents: Record<
      string,
      undefined | ((data: { data: SimpleActiveDetourData }) => void)
    > = {
      activated: undefined,
    }
    mockChannel.on.mockImplementation((event, fn) => {
      mockEvents[event] = fn
      return 1
    })

    mockSocket.channel.mockImplementation(() => mockChannel)

    const { result } = renderHook(() => useDraftDetours(mockSocket))

    act(() =>
      mockEvents["activated"]?.({
        data: simpleActiveDetourDataFactory.build({
          ...detourA,
          status: "active",
          activated_at: new Date(),
          estimated_duration: "2 hours",
        }),
      })
    )

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

    expect(mockSocket.channel).toHaveBeenNthCalledWith(1, "detours:active:1")
    expect(mockSocket.channel).toHaveBeenNthCalledWith(2, "detours:active:2")
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
    const detours = simpleActiveDetourDataFactory.buildList(3)
    const [detourA, detourB, detourC] = detours
    const [parsedDetourA, parsedDetourB, parsedDetourC] = detours.map(
      simpleDetourFromActiveData
    )

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
    const detours = simpleActiveDetourDataFactory.buildList(4)
    const [, , , detourD] = detours
    const [, , , parsedDetourD] = detours.map(simpleDetourFromActiveData)

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
