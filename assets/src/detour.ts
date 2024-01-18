import { ShapePoint } from "./schedule"

export type DirectionType =
  | "left"
  | "right"
  | "sharp_left"
  | "sharp_right"
  | "slight_left"
  | "slight_right"
  | "straight"
  | "enter_roundabout"
  | "exit_roundabout"
  | "u_turn"
  | "goal"
  | "depart"
  | "keep_left"
  | "keep_right"

export interface DetourShape {
  coordinates: ShapePoint[]
  directions: {
    instruction: string
    name: string
    type: DirectionType
  }[]
}
