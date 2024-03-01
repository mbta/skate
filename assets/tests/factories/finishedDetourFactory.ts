import { Factory } from "fishery"
import { FinishedDetour, RouteSegments } from "../../src/models/detour"
import { shapePointFactory } from "./shapePointFactory"
import stopFactory from "./stop"

export const routeSegmentsFactory = Factory.define<RouteSegments>(() => ({
  beforeDetour: shapePointFactory.buildList(3),
  detour: shapePointFactory.buildList(3),
  afterDetour: shapePointFactory.buildList(3),
}))

export const finishedDetourFactory = Factory.define<FinishedDetour>(() => ({
  missedStops: stopFactory.buildList(3),
  routeSegments: routeSegmentsFactory.build(),
}))
