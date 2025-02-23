import { Factory } from "fishery"
import { RoutePattern } from "../../src/schedule"
import { shapeFactory } from "./shape"

export const routePatternFactory = Factory.define<RoutePattern>(
  ({ sequence }) => ({
    id: `route-pattern-${sequence}`,
    name: `Route pattern From A${sequence} - To B${sequence}`,
    routeId: "66",
    directionId: 0,
    sortOrder: sequence,
    shape: shapeFactory.build(),
    headsign: `Headsign ${sequence}`,
  })
)
