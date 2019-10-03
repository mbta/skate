import shapesRed from "../../src/data/shapesRed"
import {
  subwayRouteIds,
  subwayRoutes,
  subwayRouteShapes,
} from "../../src/models/subwayRoute"

const subwayLineIds = ["Blue", "Green", "Orange", "Red"]

describe("subwayRoutes", () => {
  test("includes each of the subway lines", () => {
    expect(subwayRoutes.map(route => route.id)).toEqual(subwayLineIds)
  })
})

describe("subwayRouteIds", () => {
  test("returns a list of IDs for each subway route", () => {
    expect(subwayRouteIds).toEqual(subwayLineIds)
  })
})

describe("subwayRouteShapes", () => {
  test("returns a shapes for the requested route IDs that are subway routes", () => {
    expect(subwayRouteShapes(["1", "Red"])).toEqual(shapesRed)
  })

  test("returns an empty array if no subway routes are requested", () => {
    expect(subwayRouteShapes(["1"])).toEqual([])
  })
})
