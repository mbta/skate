import { RouteId } from "../schedule.d"
import { LadderDirections } from "./ladderDirection"
import { LadderCrowdingToggles } from "./ladderCrowdingToggle"

export interface RouteTab {
  isCurrentTab: boolean
  presetName?: string
  id?: string
  selectedRouteIds: RouteId[]
  ladderDirections: LadderDirections
  ladderCrowdingToggles: LadderCrowdingToggles
}

export const newRouteTab = (): RouteTab => ({
  isCurrentTab: true,
  selectedRouteIds: [],
  ladderDirections: {},
  ladderCrowdingToggles: {},
})

export const currentRouteTab = (routeTabs: RouteTab[]): RouteTab =>
  routeTabs.find((routeTab) => routeTab.isCurrentTab) || newRouteTab()
