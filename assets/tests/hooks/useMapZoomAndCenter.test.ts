import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useMapZoomAndCenter } from "../../src/hooks/useMapZoomAndCenter"
import { calculateGeographicCenter } from "../../src/util/geoUtils"

jest.mock("../../src/util/geoUtils", () => ({
  calculateGeographicCenter: jest.fn(),
}))

const mockedCalculate = jest.mocked(calculateGeographicCenter)

describe("useMapZoomAndCenter hook", () => {
  beforeEach(() => {
    mockedCalculate.mockReset()
  })

  test("route change sets mapCenter from shape center and sets zoom to 13 after user has changed zoom and center", async () => {
    mockedCalculate.mockReturnValue({ lat: 0, lng: 0 })

    const useDetourProps = {
      originalRoute: { center: { lat: 5, lng: 5 }, zoom: 10 },
    }

    // Start with no shape
    const { result, rerender } = renderHook(
      ({ routeDirection, routeName, shape, useDetourProps }) =>
        useMapZoomAndCenter(routeDirection, routeName, shape, useDetourProps),
      {
        initialProps: {
          routeDirection: "N",
          routeName: "",
          shape: null,
          useDetourProps,
        },
      }
    )

    // Initial zoom should be set from useDetourProps.zoom
    expect(result.current.mapZoom).toBe(10)

    // Now add a shape - this should trigger setting the center
    const shape = {
      points: [
        { lat: 0, lon: 0 },
        { lat: 1, lon: -1 },
      ],
    }

    await act(async () => {
      rerender({
        routeDirection: "N",
        routeName: "routeA",
        shape: shape as any,
        useDetourProps,
      })
    })

    await waitFor(
      () => {
        expect(result.current.mapZoom).toBe(13)
        expect(result.current.mapCenter).toEqual({ lat: 0, lng: 0 })
      },
      { timeout: 3000 }
    )

    // Simulate user changing zoom and map center using the setters returned by the hook
    await act(async () => {
      result.current.setMapZoom(15)
      result.current.setMapCenter({ lat: 10, lng: 10 })
    })

    await waitFor(
      () => {
        expect(result.current.mapZoom).toBe(15)
        expect(result.current.mapCenter).toEqual({ lat: 10, lng: 10 })
      },
      { timeout: 3000 }
    )

    // Change the routeName with new shape -> should set mapCenter to shape center and zoom to 13
    mockedCalculate.mockReturnValue({ lat: 2, lng: 2 })
    const newShape = {
      points: [
        { lat: 2, lon: -2 },
        { lat: 3, lon: -3 },
      ],
    }

    await act(async () => {
      rerender({
        routeDirection: "N",
        routeName: "routeB",
        shape: newShape as any,
        useDetourProps: {
          originalRoute: { center: { lat: 10, lng: 10 }, zoom: 15 },
        },
      })
    })

    await waitFor(
      () => {
        expect(result.current.mapCenter).toEqual({ lat: 2, lng: 2 })
        expect(result.current.mapZoom).toBe(13)
      },
      { timeout: 3000 }
    )
  })

  test("direction change does not change mapCenter or zoom after user has adjusted them", async () => {
    const useDetourProps = {
      originalRoute: { center: { lat: 5, lng: 6 }, zoom: 8 },
    }

    const { result, rerender } = renderHook(
      ({ routeDirection, routeName, shape, useDetourProps }) =>
        useMapZoomAndCenter(routeDirection, routeName, shape, useDetourProps),
      {
        initialProps: {
          routeDirection: "N",
          routeName: "routeA",
          shape: null,
          useDetourProps,
        },
      }
    )

    // initial zoom from useDetourProps
    await waitFor(
      () => {
        expect(result.current.mapZoom).toBe(8)
      },
      { timeout: 3000 }
    )

    // Simulate user changing zoom and map center using the setters returned by the hook
    await act(async () => {
      result.current.setMapZoom(12)
      result.current.setMapCenter({ lat: 20, lng: 30 })
    })

    await waitFor(
      () => {
        expect(result.current.mapZoom).toBe(12)
        expect(result.current.mapCenter).toEqual({ lat: 20, lng: 30 })
      },
      { timeout: 3000 }
    )

    // Change only direction (routeName stays the same)
    await act(async () => {
      rerender({
        routeDirection: "S",
        routeName: "routeA",
        shape: null,
        useDetourProps: {
          originalRoute: { center: { lat: 20, lng: 30 }, zoom: 12 },
        },
      })
    })

    await waitFor(
      () => {
        // mapCenter and zoom should remain as user set them
        expect(result.current.mapCenter).toEqual({ lat: 20, lng: 30 })
        expect(result.current.mapZoom).toBe(12)
      },
      { timeout: 3000 }
    )
  })

  test("shape change updates mapCenter using calculateGeographicCenter and sets zoom to 13 after user has changed zoom and center", async () => {
    // mock different centers for successive calls
    mockedCalculate
      .mockReturnValueOnce({ lat: 1, lng: 1 })
      .mockReturnValueOnce({ lat: 2, lng: 2 })

    const initialShape = {
      points: [
        { lat: 10, lon: -71 },
        { lat: 11, lon: -71 },
      ],
    }
    const newShape = {
      points: [
        { lat: 12, lon: -71 },
        { lat: 13, lon: -71 },
      ],
    }

    const { result, rerender } = renderHook(
      ({ routeDirection, routeName, shape, useDetourProps }) =>
        useMapZoomAndCenter(routeDirection, routeName, shape, useDetourProps),
      {
        initialProps: {
          routeDirection: "N",
          routeName: "routeA",
          shape: initialShape as any,
          useDetourProps: {},
        },
      }
    )

    // After initial render, mapCenter should reflect the first mocked center and zoom 13
    await waitFor(
      () => {
        expect(result.current.mapCenter).toEqual({ lat: 1, lng: 1 })
        expect(result.current.mapZoom).toBe(13)
      },
      { timeout: 3000 }
    )

    // Simulate user changing zoom and map center using the setters returned by the hook
    await act(async () => {
      result.current.setMapZoom(16)
      result.current.setMapCenter({ lat: 50, lng: 60 })
    })

    await waitFor(
      () => {
        expect(result.current.mapZoom).toBe(16)
        expect(result.current.mapCenter).toEqual({ lat: 50, lng: 60 })
      },
      { timeout: 3000 }
    )

    // Rerender with new shape -> should update to second mocked center and zoom 13
    await act(async () => {
      rerender({
        routeDirection: "N",
        routeName: "routeA",
        shape: newShape as any,
        useDetourProps: {
          originalRoute: { center: { lat: 50, lng: 60 }, zoom: 16 },
        },
      })
    })

    await waitFor(
      () => {
        expect(result.current.mapCenter).toEqual({ lat: 2, lng: 2 })
        expect(result.current.mapZoom).toBe(13)
      },
      { timeout: 3000 }
    )

    expect(mockedCalculate).toHaveBeenCalledTimes(2)
  })
})
