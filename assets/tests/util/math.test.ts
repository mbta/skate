import { describe, test, expect, it } from "@jest/globals"
import { clamp, closestPosition } from "../../src/util/math"
import { LatLngExpression, latLng } from "leaflet"

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
  it("returns `undefined` if provided a empty list", () => {
    expect(closestPosition([], latLng(0, 0))).toBeUndefined()
  })

  it("returns the closest point from the provided list", () => {
    const point = latLng(0, 0)

    const closestPoint: LatLngExpression = {
      lat: point.lat + 1,
      lng: 0,
    }
    const index = 3

    // Generate range and offset so all are farther than `position`
    const positions: LatLngExpression[] = Array(5).map((_, idx) => [
      point.lat + closestPoint.lat + idx,
      0,
    ])

    positions[index] = closestPoint

    expect(closestPosition(positions, point)).toMatchObject({
      index,
      position: closestPoint,
    })
  })
})
