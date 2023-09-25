import { describe, test, expect, jest, beforeEach } from "@jest/globals"
import { renderHook } from "@testing-library/react"
import useGeolocation from "../../src/hooks/useGeolocation"
import { mockGeolocation } from "../testHelpers/mockHelpers"
import geolocationCoordinates from "../factories/geolocationCoordinates"

describe("useGeolocation", () => {
  beforeEach(() => {
    mockGeolocation()
  })

  test("returns loading state", () => {
    const { result } = renderHook(() => useGeolocation())

    expect(navigator.geolocation.watchPosition).toHaveBeenCalled()

    expect(result.current).toBeNull()
  })

  test("cleans up watcher on unmount", () => {
    const { unmount } = renderHook(() => useGeolocation())

    unmount()

    expect(navigator.geolocation.clearWatch).toHaveBeenCalled()
  })

  test("returns geolocation result", () => {
    const coordinates = geolocationCoordinates.build({})
    jest
      .mocked(navigator.geolocation.watchPosition)
      .mockImplementation((callback) => {
        callback({
          timestamp: 1234,
          coords: coordinates,
        })

        return 1
      })

    const { result } = renderHook(() => useGeolocation())

    expect(result.current).toBe(coordinates)
  })
})
