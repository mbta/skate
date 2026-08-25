import { describe, test, expect } from "@jest/globals"
import { LatLng } from "leaflet"
import {
  calculateGeographicCenter,
  closestWithBuffer,
} from "../../src/util/geoUtils"

describe("closestWithBuffer", () => {
  test("clamps result to buffer meters from p1 when marker exceeds the buffer distance", () => {
    const p1 = new LatLng(42.35, -71.06)
    const p2 = new LatLng(42.35, -71.059) // ~82 m away at this latitude
    const result = closestWithBuffer(p1, p2, 7)
    expect(p1.distanceTo(new LatLng(result.lat, result.lng))).toBeCloseTo(7, 0)
  })

  // No buffer ratio is used when the second point is within the buffer
  test.each([
    {
      label: "marker is within the buffer distance",
      p1: new LatLng(42.35, -71.06),
      p2: new LatLng(42.35, -71.06001), // ~1 m away
      buffer: 7,
    },
    {
      label: "p1 and p2 are the same point",
      p1: new LatLng(42.35, -71.06),
      p2: new LatLng(42.35, -71.06),
      buffer: 7,
    },
  ])("returns p2 when $label", ({ p1, p2, buffer }) => {
    const result = closestWithBuffer(p1, p2, buffer)
    expect(result).toEqual({ lat: p2.lat, lng: p2.lng })
  })
})

describe("calculateGeographicCenter", () => {
  test("returns null when coordinates is empty", () => {
    expect(calculateGeographicCenter([])).toBeNull()
  })

  test("returns the arithmetic mean of lat/lon for multiple coordinates", () => {
    const result = calculateGeographicCenter([
      { lat: 10, lon: 20 },
      { lat: 20, lon: 40 },
      { lat: -10, lon: 0 },
      { lat: 20, lon: -20 },
    ])

    expect(result).toEqual({ lat: 10, lng: 10 })
  })
})
