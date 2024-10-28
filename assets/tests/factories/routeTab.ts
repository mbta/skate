import { Factory } from "fishery"
import { RouteTab } from "../../src/models/routeTab"
import { v4 as uuidv4 } from "uuid"

const defaultRouteTabFactory = Factory.define<RouteTab>(({ sequence }) => ({
  uuid: uuidv4(),
  isCurrentTab: false,
  ordering: sequence,

  presetName: `route tab preset: ${sequence}`,
  saveChangesToTabUuid: undefined,

  selectedRouteIds: [],
  ladderDirections: {},
  ladderCrowdingToggles: {},
}))

export const routeTabPresetFactory = defaultRouteTabFactory.params({
  ordering: undefined,
})

const routeTabFactory = defaultRouteTabFactory.params({
  presetName: undefined,
})

routeTabFactory.createList
export default routeTabFactory
