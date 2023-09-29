import { describe, test, expect } from "@jest/globals"
import {
  enhanceShapeForSubwayRoute,
  isASubwayRoute,
  subwayRoutes,
} from "../../src/models/subwayRoute"
import shapeFactory from "../factories/shape"
import stopFactory from "../factories/stop"

const subwayLineIds = ["Blue", "Green", "Orange", "Red", "Mattapan"]

describe("subwayRoutes", () => {
  test("includes each of the subway lines", () => {
    expect(Object.values(subwayRoutes).map((route) => route.id)).toEqual(
      subwayLineIds
    )
  })
})

describe("isASubwayRoute", () => {
  test("returns true if the route ID is a subway route, false otherwise", () => {
    expect(isASubwayRoute("Red")).toBeTruthy()
    expect(isASubwayRoute("Puce")).toBeFalsy()
  })
})

describe("enhanceShapeForSubwayRoute", () => {
  test("adds className", () => {
    const shape = shapeFactory.build()
    const stop = stopFactory.build({
      routes: [{ id: "Red", type: 1, name: "Red Line" }],
    })

    const enhancedShape = enhanceShapeForSubwayRoute(shape, "Red", [stop])

    expect(enhancedShape.className).toBe("route-shape--rail route-shape--red")

    expect(enhancedShape.stops).toEqual([stop])
  })
})
