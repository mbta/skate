import { jest, describe, test, expect } from "@jest/globals"
import { renderHook, waitFor } from "@testing-library/react"
import * as Api from "../../src/api"
import { useRouteShapes, useTripShape } from "../../src/hooks/useShapes"
import { Shape, Stop } from "../../src/schedule.d"
import { instantPromise, mockUseStateOnce } from "../testHelpers/mockHelpers"
import shapeFactory from "../factories/shape"
import { stopFactory } from "../factories/stop"

jest.mock("../../src/api", () => ({
  __esModule: true,

  fetchShapeForRoute: jest.fn(() => new Promise<Shape[]>(() => {})),

  fetchShapeForTrip: jest.fn(() => new Promise<Shape[]>(() => {})),
}))

describe("useRouteShapes", () => {
  test("fetches a shape for a route if we don't have it yet", () => {
    const mockFetchShape: jest.Mock = Api.fetchShapeForRoute as jest.Mock

    renderHook(() => {
      return useRouteShapes(["1"])
    })

    expect(mockFetchShape).toHaveBeenCalledTimes(1)
    expect(mockFetchShape).toHaveBeenCalledWith("1")
  })

  test("does not return loading data", () => {
    const { result } = renderHook(() => {
      return useRouteShapes(["1"])
    })

    expect(result.current).toEqual([])
  })

  test("loads a subway route shape from API", async () => {
    const shape = shapeFactory.build({ className: undefined })
    const mockFetchShape = jest
      .mocked(Api.fetchShapeForRoute)
      .mockReturnValueOnce(instantPromise([shape]))

    const { result, rerender } = renderHook(
      (stops?: Stop[]) => useRouteShapes(["Red"], stops),
      { initialProps: undefined }
    )

    rerender([
      stopFactory.build({
        routes: [{ id: "Red", type: 1, name: "Red Line" }],
      }),
    ])

    const initialValue = result.current
    await waitFor(() => {
      expect(result.current).not.toBe(initialValue)
    })

    expect(mockFetchShape).toHaveBeenCalledTimes(1)
    expect(mockFetchShape).toHaveBeenCalledWith("Red")
    expect(result.current[0].className).toBe(
      "route-shape--rail route-shape--red"
    )
    expect(result.current[0].stops).toHaveLength(1)
  })

  test("returns the shape when the api call returns", () => {
    const shapes: Shape[] = [
      {
        id: "shape1",
        points: [{ lat: 42.41356, lon: -70.99211 }],
      },
      {
        id: "shape2",
        points: [{ lat: 43.41356, lon: -71.99211 }],
      },
    ]
    const mockFetchShape: jest.Mock = Api.fetchShapeForRoute as jest.Mock
    mockFetchShape.mockImplementationOnce(() => instantPromise(shapes))

    const { result } = renderHook(() => {
      return useRouteShapes(["1"])
    })

    expect(result.current).toEqual(shapes)
  })

  test("does not refetch shape that is loading or loaded", () => {
    const shapes: Shape[] = [
      {
        id: "shape1",
        points: [{ lat: 42.41356, lon: -70.99211 }],
      },
      {
        id: "shape2",
        points: [{ lat: 43.41356, lon: -71.99211 }],
      },
    ]
    const selectedRouteIds = ["2", "3"]
    const shapesByRouteId = {
      2: null,
      3: shapes,
    }

    const mockFetchShape: jest.Mock = Api.fetchShapeForRoute as jest.Mock
    mockUseStateOnce(shapesByRouteId)

    const { result } = renderHook(() => {
      return useRouteShapes(selectedRouteIds)
    })

    expect(mockFetchShape).not.toHaveBeenCalled()
    expect(result.current).toEqual(shapes)
  })

  test("does not return cached data for shapes you didn't ask for", () => {
    const shapes: Shape[] = [
      {
        id: "shape",
        points: [{ lat: 42.41356, lon: -70.99211 }],
      },
    ]
    const shapesByRouteId = {
      2: shapes,
    }

    mockUseStateOnce(shapesByRouteId)

    const { result } = renderHook(() => {
      return useRouteShapes(["1"])
    })

    expect(result.current).toEqual([])
  })
})

describe("useTripShape", () => {
  test("returns [] when loading", () => {
    const mockFetchShape: jest.Mock = Api.fetchShapeForTrip as jest.Mock

    const { result } = renderHook(() => {
      return useTripShape("trip")
    })

    expect(mockFetchShape).toHaveBeenCalledTimes(1)
    expect(mockFetchShape).toHaveBeenCalledWith("trip")
    expect(result.current).toEqual([])
  })

  test("returns a shape when loaded", () => {
    const shape: Shape = {
      id: "shape",
      points: [{ lat: 42.41356, lon: -70.99211 }],
    }
    const mockFetchShape: jest.Mock = Api.fetchShapeForTrip as jest.Mock
    mockFetchShape.mockImplementationOnce(() => instantPromise(shape))
    const { result } = renderHook(() => {
      return useTripShape("1")
    })

    expect(result.current).toEqual([shape])
  })

  test("doesn't refetch shape when trip Ids don't change", () => {
    const mockFetchShape: jest.Mock = Api.fetchShapeForTrip as jest.Mock
    const { rerender } = renderHook((tripId) => useTripShape(tripId), {
      initialProps: "1",
    })
    rerender("1")
    expect(mockFetchShape).toHaveBeenCalledTimes(1)
  })

  test("does refetch shape when the trip Id changes", () => {
    const mockFetchShape: jest.Mock = Api.fetchShapeForTrip as jest.Mock
    const { rerender } = renderHook((tripId) => useTripShape(tripId), {
      initialProps: "1",
    })
    rerender("2")
    expect(mockFetchShape).toHaveBeenCalledTimes(2)
  })

  test("returns null when trip id changes to null", () => {
    const shape: Shape = {
      id: "shape",
      points: [{ lat: 42.41356, lon: -70.99211 }],
    }
    const mockFetchShape: jest.Mock = Api.fetchShapeForTrip as jest.Mock
    mockFetchShape.mockImplementationOnce(() => instantPromise(shape))
    const { rerender, result } = renderHook<Shape[], string | null>(
      (tripId) => useTripShape(tripId),
      {
        initialProps: "1",
      }
    )
    expect(result.current).toEqual([shape])

    rerender(null)
    expect(result.current).toEqual([])
  })
})
