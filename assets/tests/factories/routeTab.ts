import { Factory } from "fishery"
import { RouteTab } from "../../src/models/routeTab"
import { v4 as uuidv4 } from "uuid"

export default Factory.define<RouteTab>(({ sequence }) => ({
  uuid: uuidv4(),
  isCurrentTab: false,
  selectedRouteIds: [],
  ladderDirections: {},
  ladderCrowdingToggles: {},
  ordering: sequence,
}))
