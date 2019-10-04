import { loadedShapes } from "../../src/models/shape"
import { LoadableShapesByRouteId, RouteId, Shape } from "../../src/schedule"

describe("loadedShapes", () => {
  test("returns only those shapes that have been loaded", () => {
    const shape1: Shape = {
      id: "shape1",
      points: [{ lat: 42.41356, lon: -70.99211 }],
    }
    const shape2: Shape = {
      id: "shape2",
      points: [{ lat: 43.41356, lon: -71.99211 }],
    }
    const loadableShapes: LoadableShapesByRouteId = {
      "1": [shape1],
      "2": null,
      "3": undefined,
      "4": [shape2],
    }
    const routeIds: RouteId[] = ["1", "2", "3", "4"]

    const expected: Shape[] = [shape1, shape2]

    expect(loadedShapes(loadableShapes, routeIds)).toEqual(expected)
  })

  test("returns shapes for only those routes requested", () => {
    const shape1: Shape = {
      id: "shape1",
      points: [{ lat: 42.41356, lon: -70.99211 }],
    }
    const shape2: Shape = {
      id: "shape2",
      points: [{ lat: 43.41356, lon: -71.99211 }],
    }
    const loadableShapes: LoadableShapesByRouteId = {
      "1": [shape1],
      "2": null,
      "3": undefined,
      "4": [shape2],
    }
    const routeIds: RouteId[] = ["1", "2", "3"]

    const expected: Shape[] = [shape1]

    expect(loadedShapes(loadableShapes, routeIds)).toEqual(expected)
  })
})
