import { Factory } from "fishery"
import {
  FinishedDetour,
  RouteSegments,
  UnfinishedDetour,
  UnfinishedRouteSegments,
} from "../../src/models/detour"
import { shapePointFactory } from "./shapePointFactory"
import { stopFactory } from "./stop"
import { detourShapeFactory } from "./detourShapeFactory"

export const unfinishedRouteSegmentsFactory =
  Factory.define<UnfinishedRouteSegments>(() => ({
    beforeStartPoint: shapePointFactory.buildList(3),
    afterStartPoint: shapePointFactory.buildList(3),
  }))

export const unfinishedDetourFactory = Factory.define<UnfinishedDetour>(() => ({
  unfinishedRouteSegments: unfinishedRouteSegmentsFactory.build(),
}))

export const routeSegmentsFactory = Factory.define<RouteSegments>(() => ({
  beforeDetour: shapePointFactory.buildList(3),
  detour: shapePointFactory.buildList(3),
  afterDetour: shapePointFactory.buildList(3),
}))

export const finishedDetourFactory = Factory.define<FinishedDetour>(() => ({
  missedStops: stopFactory.buildList(3),
  routeSegments: routeSegmentsFactory.build(),
  connectionPoint: {
    start: stopFactory.build(),
    end: stopFactory.build(),
  },
  detourShape: detourShapeFactory.build(),
}))
