import { array, enums, Infer, number, string, type } from "superstruct"
import { DetourShape } from "../detour"

export const detour_direction = enums([
  "left",
  "right",
  "sharp_left",
  "sharp_right",
  "slight_left",
  "slight_right",
  "straight",
  "enter_roundabout",
  "exit_roundabout",
  "u_turn",
  "goal",
  "depart",
  "keep_left",
  "keep_right",
])

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
      name: string(),
      type: detour_direction,
    })
  ),
})
export type DetourShapeData = Infer<typeof DetourShapeData>

export const detourShapeFromData = (shapeData: DetourShapeData): DetourShape =>
  shapeData
