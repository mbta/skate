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

export const highestExistingOrdering = (routeTabs: RouteTab[]): number =>
  Math.max(
    -1,
    ...routeTabs.map((existingRouteTab) => existingRouteTab.ordering || 0)
  )

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
  routeTab.presetName !== undefined
export const isOpenTab = (routeTab: RouteTab): boolean =>
  routeTab.ordering !== undefined

export const instantiatePresetFromTabs = (
  routeTabs: RouteTab[],
  uuid: string
): RouteTab[] => {
  const preset = routeTabs.find((routeTab) => routeTab.uuid === uuid)

  if (preset === undefined) {
    throw new Error(`No preset found for UUID ${uuid}`)
  } else if (preset.ordering !== undefined) {
    return routeTabs.map((routeTab) => {
      if (routeTab.uuid === uuid) {
        return { ...routeTab, isCurrentTab: true }
      } else {
        return { ...routeTab, isCurrentTab: false }
      }
    })
  } else if (currentRouteTab(routeTabs).selectedRouteIds.length === 0) {
    return routeTabs
      .filter((routeTab) => routeTab.uuid !== uuid)
      .map((routeTab) => {
        if (routeTab.isCurrentTab) {
          return { ...preset, ordering: routeTab.ordering, isCurrentTab: true }
        } else {
          return routeTab
        }
      })
  } else {
    return routeTabs.map((routeTab) => {
      if (routeTab.uuid === uuid) {
        return {
          ...routeTab,
          isCurrentTab: true,
          ordering: highestExistingOrdering(routeTabs) + 1,
        }
      } else {
        return { ...routeTab, isCurrentTab: false }
      }
    })
  }
}

const nullToUndefined = <T>(data: T | null): T | undefined =>
  data === null ? undefined : data
