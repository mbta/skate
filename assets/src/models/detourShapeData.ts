import { array, Infer, number, string, type } from "superstruct"
import { DetourShape } from "../detour"

export const DetourShapeData = type({
  coordinates: array(
    type({
      lat: number(),
      lon: number(),
    })
  ),
  directions: array(
    type({
      instruction: string(),
    })
  ),
})
export type DetourShapeData = Infer<typeof DetourShapeData>

export const detourShapeFromData = (shapeData: DetourShapeData): DetourShape =>
  shapeData
