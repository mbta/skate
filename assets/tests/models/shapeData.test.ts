import { describe, test, expect } from "@jest/globals"
import {
  ShapeData,
  shapeFromData,
  shapesFromData,
} from "../../src/models/shapeData"
import shapeDataFactory from "../factories/shape_data"
import shapeFactory from "../factories/shape"
import stopFactory from "../factories/stop"

describe("shapeFromData", () => {
  test("handles data", () => {
    const shapeId = "shape1"
    const data: ShapeData = shapeDataFactory.build({
      id: shapeId,
    })

    const expectedResult = shapeFactory.build({
      id: shapeId,
      stops: data.stops,
    })

    expect(shapeFromData(data)).toEqual(expectedResult)
  })

  test("handles data with routes", () => {
    const shapeId = "shape1"
    const data: ShapeData = shapeDataFactory.build({
      id: shapeId,
      stops: [
        stopFactory.build({
          id: "1",
          routes: [{ type: 3, id: "747", name: "CT2" }],
        }),
      ],
    })

    const expectedResult = shapeFactory.build({
      id: shapeId,
      stops: data.stops,
    })

    expect(shapeFromData(data)).toEqual(expectedResult)
  })
})

describe("shapesFromData", () => {
  test("handles data", () => {
    const shapeId1 = "shape1"
    const shapeId2 = "shape2"
    const stopId1 = "stop1"
    const stopId2 = "stop2"
    const [shape1, shape2]: ShapeData[] = [
      shapeDataFactory.build({
        id: shapeId1,
        stops: [stopFactory.build({ id: stopId1 })],
      }),
      shapeDataFactory.build({
        id: shapeId2,
        stops: [stopFactory.build({ id: stopId2 })],
      }),
    ]

    const expectedResult = [
      shapeFactory.build({
        id: shapeId1,
        stops: shape1.stops,
      }),
      shapeFactory.build({
        id: shapeId2,
        stops: shape2.stops,
      }),
    ]

    expect(shapesFromData([shape1, shape2])).toEqual(expectedResult)
  })
})
