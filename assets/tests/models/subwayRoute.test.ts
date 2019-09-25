import redLine10Shape from "../../src/data/shapeRed-1-0"
import redLine30Shape from "../../src/data/shapeRed-3-0"
import redLine31Shape from "../../src/data/shapeRed-3-1"
import {
  subwayRouteIds,
  subwayRoutes,
  subwayRouteShapes,
} from "../../src/models/subwayRoute"
import { Shape } from "../../src/schedule"

const subwayLineIds = ["Blue", "Green", "Orange", "Red"]

describe("subwayRoutes", () => {
  test("includes each of the subway lines", () => {
    expect(subwayRoutes().map(route => route.id)).toEqual(subwayLineIds)
  })
})

describe("subwayRouteIds", () => {
  test("returns a list of IDs for each subway route", () => {
    expect(subwayRouteIds()).toEqual(subwayLineIds)
  })
})

describe("subwayRouteShapes", () => {
  test("returns a shapes for the requested route IDs that are subway routes", () => {
    const expected: Shape[] = [redLine10Shape, redLine30Shape, redLine31Shape]

    expect(subwayRouteShapes(["1", "Red"])).toEqual(expected)
  })

  test("returns an empty array if no subway routes are requested", () => {
    expect(subwayRouteShapes(["1"])).toEqual([])
  })
})
