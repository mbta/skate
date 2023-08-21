import { describe, test, expect } from "@jest/globals"
import { useAutocompleteResults } from "../../src/hooks/useAutocompleteResults"
import { renderHook } from "@testing-library/react"
import { makeMockSocket, makeMockChannel } from "../testHelpers/socketHelpers"
import vehicleDataFactory from "../factories/vehicle_data"
import { searchFiltersFactory } from "../factories/searchProperties"

describe("useAutocompleteResults", () => {
  test("returns empty lists initially", () => {
    const { result } = renderHook(() =>
      useAutocompleteResults(
        undefined,
        "searchText",
        searchFiltersFactory.build()
      )
    )
    expect(result.current).toEqual({
      operator: [],
      run: [],
      vehicle: [],
    })
  })

  test("should subscribe all channel types with search query", () => {
    const vehicleData = vehicleDataFactory.build()

    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", {
      data: { matching_vehicles: [vehicleData], has_more_matches: false },
    })
    mockSocket.channel.mockImplementation(() => mockChannel)

    const searchText = "searchText"

    renderHook(() =>
      useAutocompleteResults(
        mockSocket,
        searchText,
        searchFiltersFactory.build()
      )
    )

    expect(mockSocket.channel).toHaveBeenCalledWith(
      `vehicles_search:limited:operator:${searchText}`
    )
    expect(mockSocket.channel).toHaveBeenCalledWith(
      `vehicles_search:limited:vehicle:${searchText}`
    )
    expect(mockSocket.channel).toHaveBeenCalledWith(
      `vehicles_search:limited:run:${searchText}`
    )
    expect(mockChannel.join).toHaveBeenCalledTimes(3)
  })

  test("when category is filtered, should not subscribe to filtered channel", () => {
    const vehicleData = vehicleDataFactory.build()

    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", {
      data: { matching_vehicles: [vehicleData], has_more_matches: false },
    })
    mockSocket.channel.mockImplementation(() => mockChannel)

    const searchText = "searchText"

    renderHook(() =>
      useAutocompleteResults(
        mockSocket,
        searchText,
        searchFiltersFactory.build({
          vehicle: false,
        })
      )
    )

    expect(mockSocket.channel).toHaveBeenCalledWith(
      `vehicles_search:limited:operator:${searchText}`
    )
    expect(mockSocket.channel).not.toHaveBeenCalledWith(
      `vehicles_search:limited:vehicle:${searchText}`
    )
    expect(mockSocket.channel).toHaveBeenCalledWith(
      `vehicles_search:limited:run:${searchText}`
    )
    expect(mockChannel.join).toHaveBeenCalledTimes(2)
  })
})
