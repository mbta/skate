import { array, Infer, number, optional, string, type } from "superstruct"
import { Shape } from "../schedule"

export const ShapeData = type({
  id: string(),
  points: array(
    type({
      shape_id: string(),
      sequence: number(),
      lat: number(),
      lon: number(),
    })
  ),
  stops: optional(
    array(
      type({
        id: string(),
        name: string(),
        lat: number(),
        lon: number(),
        connections: optional(
          array(
            type({
              type: number(),
              id: string(),
              name: string(),
            })
          )
        ),
        routes: optional(
          array(
            type({
              type: number(),
              id: string(),
              name: string(),
            })
          )
        ),
      })
    )
  ),
})
export type ShapeData = Infer<typeof ShapeData>

export const shapeFromData = (shapeData: ShapeData): Shape => ({
  id: shapeData.id,
  points: shapeData.points.map((pointData) => {
    return { lat: pointData.lat, lon: pointData.lon }
  }),
  stops: shapeData.stops,
})

export const shapesFromData = (shapesData: ShapeData[]): Shape[] =>
  shapesData.map((shapeData) => shapeFromData(shapeData))
