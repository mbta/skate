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
  saveChangesToTabUuid?: string
}

export interface RouteTabData {
  uuid: string
  preset_name?: string
  selected_route_ids: RouteId[]
  ordering: number
  ladder_directions: LadderDirections
  ladder_crowding_toggles: LadderCrowdingToggles
  is_current_tab?: boolean
  save_changes_to_tab_uuid?: string
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

export const currentRouteTab = (routeTabs: RouteTab[]): RouteTab | undefined =>
  routeTabs.find((routeTab) => routeTab.isCurrentTab)

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
    saveChangesToTabUuid: nullToUndefined(
      routeTabData.save_changes_to_tab_uuid
    ),
  }))
}

export const isPreset = (routeTab: RouteTab): boolean =>
  routeTab.presetName !== undefined &&
  routeTab.saveChangesToTabUuid === undefined
export const isOpenTab = (routeTab: RouteTab): boolean =>
  routeTab.ordering !== undefined

export const instantiatePresetByUUID = (
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
  } else if (
    (currentRouteTab(routeTabs)?.selectedRouteIds || []).length === 0
  ) {
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

export const closeTabByUUID = (
  routeTabs: RouteTab[],
  uuid: string
): RouteTab[] => {
  const tabToClose = routeTabs.find((routeTab) => routeTab.uuid === uuid)

  if (tabToClose === undefined) {
    throw new Error(`No preset found for UUID ${uuid}`)
  }

  const newRouteTabs = !isPreset(tabToClose)
    ? routeTabs.filter((routeTab) => routeTab.uuid !== uuid)
    : routeTabs.map((routeTab) => {
        if (routeTab.uuid === uuid) {
          return { ...routeTab, ordering: undefined, isCurrentTab: false }
        } else {
          return routeTab
        }
      })

  if (tabToClose.isCurrentTab) {
    const nextTabToRight = newRouteTabs
      .filter(
        (routeTab) =>
          routeTab.ordering && routeTab.ordering > (tabToClose.ordering || 0)
      )
      .sort((a, b) => a.ordering || 0 - (b.ordering || 0))[0]

    if (nextTabToRight) {
      nextTabToRight.isCurrentTab = true
    } else {
      const nextTabToLeft = newRouteTabs
        .filter(
          (routeTab) =>
            routeTab.ordering && routeTab.ordering < (tabToClose.ordering || 0)
        )
        .sort((a, b) => b.ordering || 0 - (a.ordering || 0))[0]

      if (nextTabToLeft) {
        nextTabToLeft.isCurrentTab = true
      }
    }
  }

  return newRouteTabs
}

export const applyRouteTabEdit = (
  routeTabs: RouteTab[],
  uuid: string,
  updateFn: (arg0: RouteTab) => RouteTab
): RouteTab[] => {
  const tabToEdit = routeTabs.find((routeTab) => routeTab.uuid === uuid)

  if (tabToEdit === undefined) {
    throw new Error(`No tab found for UUID ${uuid}`)
  }

  if (
    tabToEdit.presetName === undefined ||
    tabToEdit.saveChangesToTabUuid !== undefined
  ) {
    return routeTabs.map((routeTab) => {
      if (routeTab.uuid === uuid) {
        return updateFn(routeTab)
      } else {
        return routeTab
      }
    })
  } else {
    const editedRouteTab = {
      ...updateFn(tabToEdit),
      uuid: uuidv4(),
      saveChangesToTabUuid: tabToEdit.uuid,
    }

    return [
      ...routeTabs.map((routeTab) => {
        if (routeTab.uuid === uuid) {
          return { ...routeTab, isCurrentTab: false, ordering: undefined }
        } else {
          return routeTab
        }
      }),
      editedRouteTab,
    ]
  }
}

const nullToUndefined = <T>(data: T | null): T | undefined =>
  data === null ? undefined : data
