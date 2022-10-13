import { renderHook } from "@testing-library/react"
import * as Api from "../../src/api"
import { useNearestIntersection } from "../../src/hooks/useNearestIntersection"
import { neverPromise } from "../../tests/testHelpers/mockHelpers"

jest.mock("../../src/api", () => ({
  __esModule: true,
  fetchNearestIntersection: jest.fn(() => neverPromise()),
}))

describe("useNearestIntersection", () => {
  test("returns null when loading", () => {
    const { result } = renderHook(() => useNearestIntersection(40, -70))
    expect(result.current).toEqual(null)
  })

  test("makes an api call", () => {
    const mockNearestIntersection: jest.Mock =
      Api.fetchNearestIntersection as jest.Mock
    renderHook(() => useNearestIntersection(40, -70))
    expect(mockNearestIntersection).toHaveBeenCalledTimes(1)
  })

  test("makes another api call if the input chnages", () => {
    const mockNearestIntersection: jest.Mock =
      Api.fetchNearestIntersection as jest.Mock
    const { rerender } = renderHook(
      ({ lat, lng }) => useNearestIntersection(lat, lng),
      { initialProps: { lat: 40, lng: -70 } }
    )
    rerender({ lat: 41, lng: -71 })
    expect(mockNearestIntersection).toHaveBeenCalledTimes(2)
  })

  test("doesn't remake an api call if the input stays the same", () => {
    const mockNearestIntersection: jest.Mock =
      Api.fetchNearestIntersection as jest.Mock
    const { rerender } = renderHook(() => useNearestIntersection(40, -70))
    rerender()
    expect(mockNearestIntersection).toHaveBeenCalledTimes(1)
  })
})
