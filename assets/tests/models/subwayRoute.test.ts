import { describe, test, expect } from "@jest/globals"
import shapesRed from "../../src/data/shapesRed"
import {
  isASubwayRoute,
  subwayRoutes,
  subwayRouteShapes,
} from "../../src/models/subwayRoute"

const subwayLineIds = ["Blue", "Green", "Orange", "Red", "Mattapan"]

describe("subwayRoutes", () => {
  test("includes each of the subway lines", () => {
    expect(subwayRoutes.map((route) => route.id)).toEqual(subwayLineIds)
  })
})

describe("isASubwayRoute", () => {
  test("returns true if the route ID is a subway route, false otherwise", () => {
    expect(isASubwayRoute("Red")).toBeTruthy()
    expect(isASubwayRoute("Puce")).toBeFalsy()
  })
})

describe("subwayRouteShapes", () => {
  test("returns an array of shapes for the requested subway route ID", () => {
    expect(subwayRouteShapes("Red")).toEqual(shapesRed)
  })

  test("returns an empty array if the route ID isn't found", () => {
    expect(subwayRouteShapes("Puce")).toEqual([])
  })
})
