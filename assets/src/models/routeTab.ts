import { RouteId } from "../schedule.d"
import {
  LadderDirections,
  emptyLadderDirectionsByRouteId,
  LadderDirectionsData,
} from "./ladderDirection"
import {
  LadderCrowdingToggles,
  emptyLadderCrowdingTogglesByRouteId,
} from "./ladderCrowdingToggle"
import { v4 as uuidv4 } from "uuid"
import { uniq, flatten } from "../helpers/array"
import {
  array,
  boolean,
  Infer,
  nullable,
  number,
  type,
  record,
  string,
} from "superstruct"

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

export const RouteTabData = type({
  uuid: string(),
  preset_name: nullable(string()),
  selected_route_ids: array(string()),
  ordering: nullable(number()),
  ladder_directions: LadderDirectionsData,
  ladder_crowding_toggles: record(string(), boolean()),
  is_current_tab: nullable(boolean()),
  save_changes_to_tab_uuid: nullable(string()),
})
export type RouteTabData = Infer<typeof RouteTabData>

export const newRouteTab = (ordering: number): RouteTab => ({
  uuid: uuidv4(),
  isCurrentTab: true,
  selectedRouteIds: [],
  ladderDirections: emptyLadderDirectionsByRouteId,
  ladderCrowdingToggles: emptyLadderCrowdingTogglesByRouteId,
  ordering,
})

export const highestExistingOrdering = (routeTabs: RouteTab[]): number =>
  Math.max(
    -1,
    ...routeTabs.map((existingRouteTab) => existingRouteTab.ordering || 0)
  )

export const currentRouteTab = (routeTabs: RouteTab[]): RouteTab | undefined =>
  routeTabs.find((routeTab) => routeTab.isCurrentTab)

export const routeTabById = (
  routeTabs: RouteTab[],
  uuid: string
): RouteTab | undefined => routeTabs.find((routeTab) => routeTab.uuid == uuid)

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
export const isEditedPreset = (routeTab: RouteTab): boolean =>
  routeTab.saveChangesToTabUuid !== undefined
export const isOpenTab = (routeTab: RouteTab): boolean =>
  routeTab.ordering !== undefined

export const tabName = (routeTab: RouteTab): string =>
  routeTab?.presetName || "Untitled"

export const currentTabName = (routeTabs: RouteTab[]): string => {
  const currentTab = currentRouteTab(routeTabs)
  if (currentTab !== undefined) return tabName(currentTab)
  return "Untitled"
}

export const selectTabByUUID = (
  routeTabs: RouteTab[],
  uuid: string
): RouteTab[] =>
  routeTabs.map((routeTab) => {
    if (routeTab.uuid === uuid) {
      return { ...routeTab, isCurrentTab: true }
    } else {
      return { ...routeTab, isCurrentTab: false }
    }
  })

export const instantiatePresetByUUID = (
  routeTabs: RouteTab[],
  uuid: string
): RouteTab[] => {
  const preset = routeTabs.find((routeTab) => routeTab.uuid === uuid)
  const openEditedPreset = routeTabs.find(
    (routeTab) =>
      routeTab.saveChangesToTabUuid === uuid && routeTab.ordering !== undefined
  )

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
  } else if (openEditedPreset !== undefined) {
    return routeTabs.map((routeTab) => {
      if (routeTab.uuid === openEditedPreset.uuid) {
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
          routeTab.ordering !== undefined &&
          routeTab.ordering > (tabToClose.ordering || 0)
      )
      .sort((a, b) => a.ordering || 0 - (b.ordering || 0))[0]

    if (nextTabToRight) {
      nextTabToRight.isCurrentTab = true
    } else {
      const nextTabToLeft = newRouteTabs
        .filter(
          (routeTab) =>
            routeTab.ordering !== undefined &&
            routeTab.ordering < (tabToClose.ordering || 0)
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

  if (!isPreset(tabToEdit) || isEditedPreset(tabToEdit)) {
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

export const saveEditedPreset = (
  routeTabs: RouteTab[],
  uuid: string
): RouteTab[] => {
  const tabToSave = routeTabs.find((routeTab) => routeTab.uuid === uuid)

  if (tabToSave === undefined) {
    throw new Error(`No tab found for UUID ${uuid}`)
  }

  if (!isEditedPreset(tabToSave)) {
    throw new Error(`Cannot save tab UUID ${uuid}: no saveChangesToTabUuid`)
  }

  return routeTabs
    .filter((routeTab) => routeTab.uuid !== tabToSave.saveChangesToTabUuid)
    .map((routeTab) => {
      if (routeTab.uuid === uuid) {
        return {
          ...routeTab,
          uuid: tabToSave.saveChangesToTabUuid as string,
          saveChangesToTabUuid: undefined,
        }
      } else {
        return routeTab
      }
    })
}

export const deletePresetByUUID = (
  routeTabs: RouteTab[],
  uuid: string
): RouteTab[] => {
  // Assumes there's at most one edited version of the tab, and if
  // there is an edited version it's currently open. Both true in
  // the current model but something to keep in mind.
  const existingTabToClose = routeTabs.find(
    (routeTab) =>
      (routeTab.uuid === uuid && routeTab.ordering !== undefined) ||
      routeTab.saveChangesToTabUuid === uuid
  )

  // Call closeTabByUUID to handle marking the correct other tab
  // as open
  const routeTabsAfterClose = existingTabToClose
    ? closeTabByUUID(routeTabs, existingTabToClose.uuid)
    : routeTabs

  return routeTabsAfterClose.filter(
    (routeTab) =>
      routeTab.uuid !== uuid && routeTab.saveChangesToTabUuid !== uuid
  )
}

export const findPresetByName = (
  routeTabs: RouteTab[],
  presetName: string
): RouteTab | undefined =>
  routeTabs.find(
    (routeTab) =>
      routeTab.presetName === presetName &&
      routeTab.saveChangesToTabUuid === undefined
  )

export const allOpenRouteIds = (routeTabs: RouteTab[]): RouteId[] =>
  uniq(
    flatten(
      routeTabs.filter(isOpenTab).map((routeTab) => routeTab.selectedRouteIds)
    )
  )

export const findFirstOpenTabWith = (
  routeTabs: RouteTab[],
  predicate: (routeTab: RouteTab) => boolean
): RouteTab | null => {
  const matchingTabs = routeTabs
    .filter((routeTab) => isOpenTab(routeTab) && predicate(routeTab))
    .sort((a, b) => (a.ordering as number) - (b.ordering as number))

  return matchingTabs[0] || null
}

const nullToUndefined = <T>(data: T | null): T | undefined =>
  data === null ? undefined : data
