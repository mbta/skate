import { Factory } from "fishery"
import { DetourDirection, DetourShape } from "../../src/models/detour"
import { shapePointFactory } from "./shapePointFactory"

export const directionsFactory = Factory.define<DetourDirection>(
  ({ sequence }) => {
    return {
      instruction: `directionInstruction${sequence}`,
    }
  }
)

export const detourShapeFactory = Factory.define<DetourShape>(() => ({
  coordinates: shapePointFactory.buildList(3),
  directions: directionsFactory.buildList(3),
}))
