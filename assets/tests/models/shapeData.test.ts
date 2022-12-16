import {
  ShapeData,
  shapeFromData,
  shapesFromData,
} from "../../src/models/shapeData"
import shapeDataFactory from "../factories/shape_data"
import shapeFactory from "../factories/shape"

describe("shapeFromData", () => {
  test("handles data", () => {
    const shapeId = "shape1"
    const data: ShapeData = shapeDataFactory.build({
      id: shapeId,
    })

    const expectedResult = shapeFactory.build({
      id: shapeId,
    })

    expect(shapeFromData(data)).toEqual(expectedResult)
  })
})

describe("shapesFromData", () => {
  test("handles data", () => {
    const shapeId1 = "shape1"
    const shapeId2 = "shape1"
    const data: ShapeData[] = [
      shapeDataFactory.build({ id: shapeId1 }),
      shapeDataFactory.build({ id: shapeId2 }),
    ]

    const expectedResult = [
      shapeFactory.build({ id: shapeId1 }),
      shapeFactory.build({ id: shapeId2 }),
    ]

    expect(shapesFromData(data)).toEqual(expectedResult)
  })
})
