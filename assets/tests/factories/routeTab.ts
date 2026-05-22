import { randomUUID } from "crypto"
import { Factory } from "fishery"
import { RouteTab } from "../../src/models/routeTab"

const defaultRouteTabFactory = Factory.define<RouteTab>(({ sequence }) => ({
  uuid: randomUUID(),
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

export const routeTabFactory = defaultRouteTabFactory.params({
  presetName: undefined,
})

export default routeTabFactory
