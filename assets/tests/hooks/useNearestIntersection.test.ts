import { renderHook, waitFor } from "@testing-library/react"
import * as Api from "../../src/api"
import { useNearestIntersection } from "../../src/hooks/useNearestIntersection"
import { neverPromise } from "../../tests/testHelpers/mockHelpers"
import { gridIntersectionFactory } from "../factories/gridIntersection"
import { localGeoCoordinateFactory } from "../factories/geoCoordinate"
import { GeographicCoordinate } from "../../src/components/streetViewButton"

jest.mock("../../src/api", () => ({
  __esModule: true,
  fetchNearestIntersection: jest.fn(() => neverPromise()),
}))

afterEach(() => {
  jest.clearAllMocks()
})

const Loading = () => null
const Ok = (v: any) => v
const Err = (_?: any) => null

const renderUseNearestIntersection = (location: GeographicCoordinate) =>
  renderHook(
    ({ latitude, longitude }) => useNearestIntersection(latitude, longitude),
    {
      initialProps: location,
    }
  )

function CoordinateIntersectionMap(
  numberOfEntries: number,
  errorValue: any = null
) {
  const intersections = gridIntersectionFactory.buildList(numberOfEntries)
  const coordinates = localGeoCoordinateFactory.buildList(numberOfEntries)

  const map = new Map(
    coordinates.map((coordinate, index) => [
      JSON.stringify(coordinate),
      intersections[index],
    ])
  )

  const lookupFn = (coordinate: GeographicCoordinate) =>
    map.get(JSON.stringify(coordinate)) ?? errorValue

  const mockImplementation = (latitude: number, longitude: number) =>
    Promise.resolve(lookupFn({ latitude, longitude }))

  return {
    intersections,
    coordinates,
    map,
    lookupFn,
    mockImplementation,
  }
}

export const MockIntersectionWithCoordinateIntersectionMap = (
  numberOfEntries = 1,
  errorValue: any = null
) => {
  const result = CoordinateIntersectionMap(numberOfEntries, errorValue)

  ;(Api.fetchNearestIntersection as jest.Mock).mockImplementation(
    result.mockImplementation
  )

  return result
}

describe("useNearestIntersection", () => {
  describe("when first rendered", () => {
    test("should return loading state", async () => {
      const { result } = renderUseNearestIntersection(
        localGeoCoordinateFactory.build()
      )
      expect(result.current).toEqual(Loading())
    })

    test("should make an api call", () => {
      const mockNearestIntersection: jest.Mock =
        Api.fetchNearestIntersection as jest.Mock

      renderUseNearestIntersection(localGeoCoordinateFactory.build())

      expect(mockNearestIntersection).toHaveBeenCalledTimes(1)
    })
  })

  describe("when coordinate input is unchanged", () => {
    test("should return the last result", async () => {
      const intersection = gridIntersectionFactory.build()
      ;(Api.fetchNearestIntersection as jest.Mock).mockReturnValueOnce(
        Promise.resolve(intersection)
      )
      const location = localGeoCoordinateFactory.build()

      const { result, rerender } = renderUseNearestIntersection(location)

      await waitFor(() => expect(result.current).toEqual(Ok(intersection)))

      rerender(location)

      expect(result.current).toEqual(Ok(intersection))
    })

    test("should not make an api call", () => {
      const mockNearestIntersection: jest.Mock =
        Api.fetchNearestIntersection as jest.Mock
      const location = localGeoCoordinateFactory.build()
      const { rerender } = renderUseNearestIntersection(location)

      rerender(location)

      expect(mockNearestIntersection).toHaveBeenCalledTimes(1)
    })
  })

  describe("when coordinate input changes", () => {
    test("should return last result until promise resolves", async () => {
      const {
        coordinates: [latLng1, latLng2],
        intersections: [intersection1, intersection2],
      } = MockIntersectionWithCoordinateIntersectionMap(2, null)
      const fetchFn = Api.fetchNearestIntersection as jest.Mock

      const { rerender, result } = renderUseNearestIntersection(latLng1)

      expect(result.current).toBe(Loading())
      await waitFor(() => expect(result.current).toBe(intersection1))

      rerender(latLng2)

      expect(result.current).toBe(intersection1)
      expect(fetchFn).toBeCalledWith(latLng2.latitude, latLng2.longitude)

      await waitFor(async () => expect(result.current).toBe(intersection2))
    })

    test("should make another api call", async () => {
      const mockNearestIntersection: jest.Mock =
        Api.fetchNearestIntersection as jest.Mock

      const { rerender } = renderUseNearestIntersection(
        localGeoCoordinateFactory.build()
      )

      expect(mockNearestIntersection).toBeCalledTimes(1)

      rerender(localGeoCoordinateFactory.build())

      await waitFor(() =>
        expect(mockNearestIntersection).toHaveBeenCalledTimes(2)
      )
    })
  })

  describe("when api call returns error", () => {
    test("should return error value", async () => {
      ;(Api.fetchNearestIntersection as jest.Mock).mockReturnValueOnce(
        Promise.resolve(Err())
      )
      const location = localGeoCoordinateFactory.build()

      const { result } = renderUseNearestIntersection(location)

      await waitFor(() =>
        expect(result.current).toEqual(Err(expect.anything()))
      )
    })
  })
})
