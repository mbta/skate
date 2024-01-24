import { ShapePoint } from "./schedule"

export interface DetourShape {
  coordinates: ShapePoint[]
  directions: {
    instruction: string
  }[]
}
