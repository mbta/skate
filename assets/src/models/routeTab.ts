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

export const currentRouteTab = (routeTabs: RouteTab[]): RouteTab => {
  const currentTab = routeTabs.find((routeTab) => routeTab.isCurrentTab)

  if (currentTab === undefined) {
    return newRouteTab()
  } else {
    return currentTab
  }
}
