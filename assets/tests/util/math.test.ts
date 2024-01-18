import { describe, test, expect } from "@jest/globals"
import { clamp, closestPosition } from "../../src/util/math"
import { LatLngLiteral, latLng } from "leaflet"

describe("clamp", () => {
  test("when value is below minimum, returns minimum value", () => {
    expect(clamp(-11, -10, 0)).toBe(-10)
  })

  test("when value is above maximum, returns maximum value", () => {
    expect(clamp(11, 0, 10)).toBe(10)
  })

  test("when value is between minimum and maximum, returns value", () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })
})

describe("closestPosition", () => {
  test("returns `undefined` if provided a empty list", () => {
    expect(closestPosition([], latLng(0, 0))).toBeUndefined()
  })

  test("returns the closest point from the provided list", () => {
    const point = latLng(0, 0)

    const closestPoint: LatLngLiteral = {
      lat: point.lat + 1,
      lng: 0,
    }
    const index = 3

    // Generate range and offset so all are farther than `closestPoint`
    const positions: LatLngLiteral[] = Array(5).map((_, idx) => ({
      lat: point.lat + closestPoint.lat + idx,
      lng: 0,
    }))

    positions[index] = closestPoint

    expect(closestPosition(positions, point)).toMatchObject({
      index,
      position: closestPoint,
    })
  })
})
