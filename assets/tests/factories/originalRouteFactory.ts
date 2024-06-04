import { Factory } from "fishery"
import { OriginalRoute } from "../../src/models/detour"
import routeFactory from "./route"
import { routePatternFactory } from "./routePattern"
import { latLngLiteralFactory } from "./latLngLiteralFactory"

export const originalRouteFactory = Factory.define<OriginalRoute>(() => {
  const route = routeFactory.build()
  const routePattern = routePatternFactory.build({ routeId: route.id })
  return {
    route,
    routePattern,
    center: latLngLiteralFactory.build(),
    zoom: 16,
  }
})
