import {
  jest,
  describe,
  test,
  expect,
  afterEach,
  beforeEach,
} from "@jest/globals"
import { renderHook, waitFor, act } from "@testing-library/react"
import * as Api from "../../src/api"
import { useNearestIntersectionFetchResult } from "../../src/hooks/useNearestIntersection"
import { gridIntersectionFactory } from "../factories/gridIntersection"
import { localGeoCoordinateFactory } from "../factories/geoCoordinate"
import { GeographicCoordinate } from "../../src/components/streetViewButton"
import { PromiseWithResolvers } from "../testHelpers/PromiseWithResolvers"

jest.mock("../../src/api")

beforeEach(() => {
  jest
    .mocked(Api.fetchNearestIntersection)
    .mockImplementation(() => new Promise(() => {}))
})

afterEach(() => {
  jest.clearAllMocks()
})

const Loading = () => {
  return { is_loading: true }
}
const Ok = (v: any) => {
  return { ok: v }
}
const LoadingOk = (v: any) => {
  return { is_loading: true, ok: v }
}
const Err = () => {
  return { is_error: true }
}

const renderUseNearestIntersection = (location: GeographicCoordinate) =>
  renderHook(
    ({ latitude, longitude }) =>
      useNearestIntersectionFetchResult(latitude, longitude),
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

  const lookupFn = (coordinate: GeographicCoordinate) => {
    return map.get(JSON.stringify(coordinate)) ?? errorValue
  }

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

const MockIntersectionWithCoordinateIntersectionMap = (
  numberOfEntries = 1,
  errorValue: any = null
) => {
  const result = CoordinateIntersectionMap(numberOfEntries, errorValue)

  jest
    .mocked(Api.fetchNearestIntersection)
    .mockImplementation(result.mockImplementation)

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
      jest
        .mocked(Api.fetchNearestIntersection)
        .mockReturnValueOnce(Promise.resolve(intersection))
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

      const { rerender, result } = renderUseNearestIntersection(latLng1)

      expect(result.current).toEqual(Loading())
      await waitFor(() => expect(result.current).toEqual(Ok(intersection1)))

      rerender(latLng2)

      expect(result.current).toEqual(LoadingOk(intersection1))
      expect(jest.mocked(Api.fetchNearestIntersection)).toHaveBeenCalledWith(
        latLng2.latitude,
        latLng2.longitude
      )

      await waitFor(async () =>
        expect(result.current).toEqual(Ok(intersection2))
      )
    })

    test("should make another api call", async () => {
      const mockNearestIntersection = jest.mocked(Api.fetchNearestIntersection)

      const { rerender } = renderUseNearestIntersection(
        localGeoCoordinateFactory.build()
      )

      expect(mockNearestIntersection).toHaveBeenCalledTimes(1)

      rerender(localGeoCoordinateFactory.build())

      await waitFor(() =>
        expect(mockNearestIntersection).toHaveBeenCalledTimes(2)
      )
    })

    test("previous api calls that resolve out of order don't change return value", async () => {
      const {
        coordinates: [latLng1, latLng2],
        intersections: [intersection1, intersection2],
      } = MockIntersectionWithCoordinateIntersectionMap(2, null)

      const { promise, resolve } = PromiseWithResolvers<string | null>()
      jest.mocked(Api.fetchNearestIntersection).mockReturnValue(promise)

      const { rerender, result } = renderUseNearestIntersection(latLng1)

      jest.mocked(Api.fetchNearestIntersection).mockResolvedValue(intersection2)

      rerender(latLng2)

      act(() => resolve(intersection1))

      await waitFor(() => expect(result.current).toEqual(Ok(intersection2)))
    })
  })

  describe("when api call returns error", () => {
    test("should return error value", async () => {
      jest.mocked(Api.fetchNearestIntersection).mockResolvedValueOnce(null)

      const location = localGeoCoordinateFactory.build()

      const { result } = renderUseNearestIntersection(location)

      await waitFor(() => expect(result.current).toEqual(Err()))
    })
  })
})
