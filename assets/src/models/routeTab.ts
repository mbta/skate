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
  ordering: number
}

export const newRouteTab = (ordering: number): RouteTab => ({
  isCurrentTab: true,
  selectedRouteIds: [],
  ladderDirections: {},
  ladderCrowdingToggles: {},
  ordering,
})

export const currentRouteTab = (routeTabs: RouteTab[]): RouteTab =>
  routeTabs.find((routeTab) => routeTab.isCurrentTab) || newRouteTab(0)
