import { jest, describe, test, expect } from "@jest/globals"
import { act, renderHook } from "@testing-library/react"
import { useSearchResults } from "../../src/hooks/useSearchResults"
import { VehiclePropertyQuery } from "../../src/models/searchQuery"
import { VehicleData, vehicleFromData } from "../../src/models/vehicleData"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"

import vehicleDataFactory from "../factories/vehicle_data"

describe("useSearchResults", () => {
  test("when query given and loading, returns loading", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() =>
      useSearchResults(mockSocket, {
        property: "vehicle",
        text: "1234",
        limit: 5,
      })
    )
    expect(result.current).toEqual({ is_loading: true })
  })
  test("when no query given, returns null", () => {
    const mockSocket = makeMockSocket()

    const { result } = renderHook(() => useSearchResults(mockSocket, null))
    expect(result.current).toEqual(null)
  })

  test("when no query is for empty string, returns null", () => {
    const mockSocket = makeMockSocket()

    const { result } = renderHook(() =>
      useSearchResults(mockSocket, {
        text: "",
        property: "run",
        limit: 5,
      })
    )
    expect(result.current).toEqual(null)
  })

  test("initializing the hook subscribes to the search results", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() =>
      useSearchResults(mockSocket, {
        text: "123",
        property: "run",
        limit: 5,
      })
    )

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockSocket.channel).toHaveBeenCalledWith(
      "vehicles_search:limited:run:123"
    )
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("returns results pushed to the channel", () => {
    const vehicleData: VehicleData = vehicleDataFactory.build()

    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", {
      data: { matching_vehicles: [vehicleData], has_more_matches: false },
    })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() =>
      useSearchResults(mockSocket, {
        property: "run",
        text: "123",
        limit: 5,
      })
    )

    expect(result.current).toEqual({
      ok: {
        matches: [vehicleFromData(vehicleData)],
        hasMoreMatches: false,
      },
    })
  })

  test("when the limit changes, stays subscribed to the existing topic and pushes message to increase limit", () => {
    const mockSocket = makeMockSocket()
    const vehicleDataAfterLimitIncrease = vehicleDataFactory.build()
    const channel1 = makeMockChannel(
      "ok",
      jest
        .fn()
        .mockReturnValueOnce({
          data: { matching_vehicles: [], has_more_matches: false },
        })
        // For first no-op push on channel join
        .mockReturnValueOnce({
          data: {
            matching_vehicles: [vehicleDataFactory.build()],
            has_more_matches: true,
          },
        })
        // For push on limit increase
        .mockReturnValueOnce({
          data: {
            matching_vehicles: [vehicleDataAfterLimitIncrease],
            has_more_matches: true,
          },
        })
    )
    mockSocket.channel.mockImplementation(() => channel1)

    const initialQuery = {
      property: "run" as VehiclePropertyQuery,
      text: "123",
      limit: 5,
    }

    const { rerender, result } = renderHook(
      (query) => useSearchResults(mockSocket, query),
      {
        initialProps: initialQuery,
      }
    )

    act(() => {
      rerender({ ...initialQuery, limit: 30 })
    })

    expect(channel1.leave).not.toHaveBeenCalled()

    expect(channel1.push).toHaveBeenCalledWith("update_search_query", {
      limit: 30,
    })
    expect(result.current).toEqual({
      ok: {
        hasMoreMatches: true,
        matches: [vehicleFromData(vehicleDataAfterLimitIncrease)],
      },
    })
  })
})
