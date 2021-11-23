import { RouteId } from "../schedule.d"
import { LadderDirections } from "./ladderDirection"
import { LadderCrowdingToggles } from "./ladderCrowdingToggle"
import { v4 as uuidv4 } from "uuid"

export interface RouteTab {
  uuid: string
  isCurrentTab: boolean
  presetName?: string
  selectedRouteIds: RouteId[]
  ladderDirections: LadderDirections
  ladderCrowdingToggles: LadderCrowdingToggles
  ordering?: number
}

export interface RouteTabData {
  uuid: string
  preset_name?: string
  selected_route_ids: RouteId[]
  ordering: number
  ladder_directions: LadderDirections
  ladder_crowding_toggles: LadderCrowdingToggles
  is_current_tab?: boolean
}

export const newRouteTab = (ordering: number): RouteTab => ({
  uuid: uuidv4(),
  isCurrentTab: true,
  selectedRouteIds: [],
  ladderDirections: {},
  ladderCrowdingToggles: {},
  ordering,
})

export const newPreset = (sourceTab: RouteTab): RouteTab => ({
  ...sourceTab,
  isCurrentTab: false,
  presetName: `Preset ${Math.floor(Math.random() * 10000)}`,
  uuid: uuidv4(),
  ordering: undefined,
})

export const tabFromPreset = (
  preset: RouteTab,
  ordering: number
): RouteTab => ({
  ...preset,
  isCurrentTab: true,
  uuid: uuidv4(),
  ordering,
})

export const currentRouteTab = (routeTabs: RouteTab[]): RouteTab =>
  routeTabs.find((routeTab) => routeTab.isCurrentTab) || newRouteTab(0)

export const parseRouteTabData = (
  routeTabsData: RouteTabData[]
): RouteTab[] => {
  return routeTabsData.map((routeTabData) => ({
    uuid: routeTabData.uuid,
    ordering: nullToUndefined(routeTabData.ordering),
    presetName: nullToUndefined(routeTabData.preset_name),
    isCurrentTab: routeTabData.is_current_tab || false,
    selectedRouteIds: routeTabData.selected_route_ids,
    ladderDirections: routeTabData.ladder_directions,
    ladderCrowdingToggles: routeTabData.ladder_crowding_toggles,
  }))
}

export const isPreset = (routeTab: RouteTab): boolean =>
  routeTab.ordering === undefined
export const isNotPreset = (routeTab: RouteTab): boolean => !isPreset(routeTab)

const nullToUndefined = <T>(data: T | null): T | undefined =>
  data === null ? undefined : data
