import { ShapePoint } from "./schedule"

export enum DirectionType {
  Left = "left",
  Right = "right",
  SharpLeft = "sharp_left",
  SharpRight = "sharp_right",
  SlightLeft = "slight_left",
  SlightRight = "slight_right",
  Straight = "straight",
  EnterRoundabout = "enter_roundabout",
  ExitRoundabout = "exit_roundabout",
  UTurn = "u_turn",
  Goal = "goal",
  Depart = "depart",
  KeepLeft = "keep_left",
  KeepRight = "keep_right",
}

export interface DetourShape {
  coordinates: ShapePoint[]
  directions: {
    instruction: string
    name: string
    // type: DirectionType
    type:
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
  }[]
}
