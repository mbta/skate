import { Factory } from "fishery"
import { RouteTab } from "../../src/models/routeTab"

export default Factory.define<RouteTab>(({ sequence }) => ({
  isCurrentTab: false,
  selectedRouteIds: [],
  ladderDirections: {},
  ladderCrowdingToggles: {},
  ordering: sequence,
}))
