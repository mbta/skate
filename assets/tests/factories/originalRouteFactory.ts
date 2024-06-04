import { Factory } from "fishery"
import { OriginalRoute } from "../../src/models/detour"
import routeFactory from "./route"
import { routePatternFactory } from "./routePattern"
import { latLngLiteralFactory } from "./latLngLiteralFactory"
import shapeFactory from "./shape"

export const originalRouteFactory = Factory.define<OriginalRoute>(() => {
  const route = routeFactory.build()
  const routePattern = routePatternFactory.build({ routeId: route.id })
  return {
    routeName: route.name,
    routeDescription: routePattern.headsign || "",
    routeOrigin: routePattern.name,
    routeDirection: "Outbound",
    routePatternId: routePattern.id,
    shape: shapeFactory.build(),
    route,
    routePattern,
    center: latLngLiteralFactory.build(),
    zoom: 16,
  }
})
