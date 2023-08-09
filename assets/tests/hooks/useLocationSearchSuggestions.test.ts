import { useLocationSearchSuggestions } from "../../src/hooks/useLocationSearchSuggestions"
import { renderHook } from "@testing-library/react"
import * as Api from "../../src/api"
import { instantPromise } from "../testHelpers/mockHelpers"
import locationSearchSuggestionFactory from "../factories/locationSearchSuggestion"

jest.mock("../../src/api", () => ({
  __esModule: true,

  fetchLocationSearchSuggestions: jest.fn(() => new Promise(() => {})),
}))

describe("useLocationSearchSuggestions", () => {
  test("returns null if no search query is given", () => {
    const mockFetchLocationSearchSuggestions: jest.Mock =
      Api.fetchLocationSearchSuggestions as jest.Mock

    const { result } = renderHook(() => useLocationSearchSuggestions(null))

    expect(result.current).toBeNull()
    expect(mockFetchLocationSearchSuggestions).not.toHaveBeenCalled()
  })

  test("returns null while loading", () => {
    const mockFetchLocationSearchSuggestions: jest.Mock =
      Api.fetchLocationSearchSuggestions as jest.Mock

    const { result } = renderHook(() =>
      useLocationSearchSuggestions("search string")
    )

    expect(result.current).toBeNull()
    expect(mockFetchLocationSearchSuggestions).toHaveBeenCalled()
  })

  test("returns results", () => {
    const results = [locationSearchSuggestionFactory.build()]
    const mockFetchLocationSearchSuggestions: jest.Mock =
      Api.fetchLocationSearchSuggestions as jest.Mock
    mockFetchLocationSearchSuggestions.mockImplementationOnce(() =>
      instantPromise(results)
    )

    const { result } = renderHook(() =>
      useLocationSearchSuggestions("search string")
    )

    expect(result.current).toEqual(results)
    expect(mockFetchLocationSearchSuggestions).toHaveBeenCalled()
  })
})
