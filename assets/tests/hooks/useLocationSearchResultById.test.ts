import { useLocationSearchResultById } from "../../src/hooks/useLocationSearchResultById"
import { renderHook } from "@testing-library/react"
import * as Api from "../../src/api"
import { instantPromise } from "../testHelpers/mockHelpers"
import locationSearchResultFactory from "../factories/locationSearchResult"

jest.mock("../../src/api", () => ({
  __esModule: true,

  fetchLocationSearchResultById: jest.fn(() => new Promise(() => {})),
}))

describe("useLocationSearchResultById", () => {
  test("returns null if no search query is given", () => {
    const mockFetchLocationSearchResultById: jest.Mock =
      Api.fetchLocationSearchResultById as jest.Mock

    const { result } = renderHook(() => useLocationSearchResultById(null))

    expect(result.current).toBeNull()
    expect(mockFetchLocationSearchResultById).not.toHaveBeenCalled()
  })

  test("returns null while loading", () => {
    const mockFetchLocationSearchResultById: jest.Mock =
      Api.fetchLocationSearchResultById as jest.Mock

    const { result } = renderHook(() => useLocationSearchResultById("place_id"))

    expect(result.current).toBeNull()
    expect(mockFetchLocationSearchResultById).toHaveBeenCalled()
  })

  test("returns results", () => {
    const results = [locationSearchResultFactory.build()]
    const mockFetchLocationSearchResultById: jest.Mock =
      Api.fetchLocationSearchResultById as jest.Mock
    mockFetchLocationSearchResultById.mockImplementationOnce(() =>
      instantPromise(results)
    )

    const { result } = renderHook(() => useLocationSearchResultById("place_id"))

    expect(result.current).toEqual(results)
    expect(mockFetchLocationSearchResultById).toHaveBeenCalled()
  })
})
