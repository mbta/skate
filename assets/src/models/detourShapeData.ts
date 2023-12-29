import { array, Infer, number, type } from "superstruct"
import { DetourShape } from "../detour"

export const DetourShapeData = type({
  coordinates: array(
    type({
      lat: number(),
      lon: number(),
    })
  ),
})
export type DetourShapeData = Infer<typeof DetourShapeData>

export const detourShapeFromData = (
  shapeData: DetourShapeData
): DetourShape => ({
  coordinates: shapeData.coordinates.map((pointData) => {
    return { lat: pointData.lat, lon: pointData.lon }
  }),
})
