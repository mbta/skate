import { renderHook, waitFor } from "@testing-library/react"
import * as Api from "../../src/api"
import { GeographicCoordinate } from "../../src/components/streetViewButton"
import { useNearestIntersection } from "../../src/hooks/useNearestIntersection"
import { neverPromise } from "../../tests/testHelpers/mockHelpers"
import { localGeoCoordinateFactory } from "../factories/geoCoordinate"
import { gridIntersectionFactory } from "../factories/gridIntersection"

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
  const renderUseNearestIntersection = (location: GeographicCoordinate) =>
    renderHook(
      ({ latitude, longitude }) => useNearestIntersection(latitude, longitude),
      {
        initialProps: location,
      }
    )

  test("when input changes, should return same intersection until next ok result", async () => {
    const [intersection1, intersection2] = gridIntersectionFactory.buildList(2)
    const [latLng1, latLng2] = localGeoCoordinateFactory.buildList(2)
    const map = new Map([
      [JSON.stringify(latLng1), intersection1],
      [JSON.stringify(latLng2), intersection2],
    ])

    const mockNearestIntersection: jest.Mock =
      Api.fetchNearestIntersection as jest.Mock

    mockNearestIntersection.mockImplementation((latitude, longitude) =>
      Promise.resolve(map.get(JSON.stringify({ latitude, longitude })) ?? null)
    )

    const { rerender, result } = renderUseNearestIntersection(latLng1)

    expect(result.current).toBe(null)
    await waitFor(() => expect(result.current).toBe(intersection1))

    rerender(latLng2)

    expect(result.current).toBe(intersection1)
    await waitFor(() => expect(result.current).toBe(intersection2))

    expect(mockNearestIntersection).toHaveBeenCalledTimes(2)
  })
})
