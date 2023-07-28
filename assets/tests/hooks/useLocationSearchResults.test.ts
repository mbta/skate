import { useLocationSearchResults } from "../../src/hooks/useLocationSearchResults"
import { renderHook } from "@testing-library/react"
import * as Api from "../../src/api"
import { instantPromise } from "../testHelpers/mockHelpers"
import locationSearchResultFactory from "../factories/locationSearchResult"

jest.mock("../../src/api", () => ({
  __esModule: true,

  fetchLocationSearchResults: jest.fn(() => new Promise(() => {})),
}))

describe("useLocationSearchResults", () => {
  test("returns null if no search query is given", () => {
    const mockFetchLocationSearchResults: jest.Mock =
      Api.fetchLocationSearchResults as jest.Mock

    const { result } = renderHook(() => useLocationSearchResults(null))

    expect(result.current).toBeNull()
    expect(mockFetchLocationSearchResults).not.toHaveBeenCalled()
  })

  test("returns null while loading", () => {
    const mockFetchLocationSearchResults: jest.Mock =
      Api.fetchLocationSearchResults as jest.Mock

    const { result } = renderHook(() =>
      useLocationSearchResults("search string")
    )

    expect(result.current).toBeNull()
    expect(mockFetchLocationSearchResults).toHaveBeenCalled()
  })

  test("returns results", () => {
    const results = [locationSearchResultFactory.build()]
    const mockFetchLocationSearchResults: jest.Mock =
      Api.fetchLocationSearchResults as jest.Mock
    mockFetchLocationSearchResults.mockImplementationOnce(() =>
      instantPromise(results)
    )

    const { result } = renderHook(() =>
      useLocationSearchResults("search string")
    )

    expect(result.current).toEqual(results)
    expect(mockFetchLocationSearchResults).toHaveBeenCalled()
  })
})
