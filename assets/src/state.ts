import { Dispatch as ReactDispatch } from "react"
import { toggleLadderCrowdingForRoute } from "./models/ladderCrowdingToggle"
import { flipLadderDirectionForRoute } from "./models/ladderDirection"
import { Notification, RunId, VehicleOrGhost } from "./realtime.d"
import { RouteId } from "./schedule.d"
import {
  Action as SearchAction,
  initialSearchPageState,
  reducer as searchReducer,
  SearchPageState,
} from "./state/searchPageState"
import {
  defaultUserSettings,
  UserSettings,
  VehicleLabelSetting,
  VehicleAdherenceColorsSetting,
} from "./userSettings"
import {
  RouteTab,
  currentRouteTab,
  newRouteTab,
  highestExistingOrdering,
  instantiatePresetByUUID,
  closeTabByUUID,
  applyRouteTabEdit,
  saveEditedPreset,
  deletePresetByUUID,
  isEditedPreset,
  isPreset,
  findFirstOpenTabWith,
  selectTabByUUID,
} from "./models/routeTab"
import featureIsEnabled from "./laboratoryFeatures"

export enum OpenView {
  None = 1,
  Swings,
  Late,
  NotificationDrawer,
}

interface CreatePresetModal {
  type: "CREATE_PRESET"
  createCallback: (presetName: string, dispatch: React.Dispatch<Action>) => void
  confirmOverwriteCallback: (
    existingPresetName: string,
    uuid: string,
    dispatch: React.Dispatch<Action>
  ) => void
}

interface SavePresetModal {
  type: "SAVE_PRESET"
  saveCallback: (dispatch: React.Dispatch<Action>) => void
  presetName: string
}

interface DeletePresetModal {
  type: "DELETE_PRESET"
  deleteCallback: (dispatch: React.Dispatch<Action>) => void
  presetName: string
}

interface OverwritePresetModal {
  type: "OVERWRITE_PRESET"
  confirmCallback: (dispatch: React.Dispatch<Action>) => void
  presetName: string
}

export type OpenInputModal =
  | CreatePresetModal
  | SavePresetModal
  | DeletePresetModal
  | OverwritePresetModal

export interface State {
  pickerContainerIsVisible: boolean
  searchPageState: SearchPageState
  routeTabs: RouteTab[]
  routeTabsToPush: RouteTab[] | null
  routeTabsToPushNext: RouteTab[] | null
  routeTabsPushInProgress: boolean
  selectedShuttleRouteIds: RouteId[]
  selectedShuttleRunIds: RunId[] | "all"
  selectedVehicleOrGhost?: VehicleOrGhost | null
  userSettings: UserSettings
  selectedNotification?: Notification
  openView: OpenView
  previousView: OpenView
  openInputModal: OpenInputModal | null
  mobileMenuIsOpen: boolean
  showGaragesFilter: boolean
}

export const initialState: State = {
  pickerContainerIsVisible: true,
  searchPageState: initialSearchPageState,
  routeTabs: [],
  routeTabsToPush: null,
  routeTabsToPushNext: null,
  routeTabsPushInProgress: false,
  selectedShuttleRouteIds: [],
  selectedShuttleRunIds: "all",
  selectedVehicleOrGhost: undefined,
  userSettings: defaultUserSettings,
  selectedNotification: undefined,
  openView: OpenView.None,
  previousView: OpenView.None,
  openInputModal: null,
  mobileMenuIsOpen: false,
  showGaragesFilter: false,
}

interface CreateRouteTabAction {
  type: "CREATE_ROUTE_TAB"
}

export const createRouteTab = (): CreateRouteTabAction => ({
  type: "CREATE_ROUTE_TAB",
})

interface CloseRouteTabAction {
  type: "CLOSE_ROUTE_TAB"
  payload: { uuid: string }
}

export const closeRouteTab = (uuid: string): CloseRouteTabAction => ({
  type: "CLOSE_ROUTE_TAB",
  payload: { uuid },
})

interface SelectRouteTabAction {
  type: "SELECT_ROUTE_TAB"
  payload: {
    uuid: string
  }
}

export const selectRouteTab = (uuid: string): SelectRouteTabAction => ({
  type: "SELECT_ROUTE_TAB",
  payload: {
    uuid,
  },
})

interface SelectRouteInTabAction {
  type: "SELECT_ROUTE_IN_TAB"
  payload: {
    routeId: RouteId
  }
}

export const selectRouteInTab = (routeId: RouteId): SelectRouteInTabAction => ({
  type: "SELECT_ROUTE_IN_TAB",
  payload: { routeId },
})

export interface DeselectRouteInTabAction {
  type: "DESELECT_ROUTE_IN_TAB"
  payload: {
    routeId: RouteId
  }
}

export const deselectRouteInTab = (
  routeId: RouteId
): DeselectRouteInTabAction => ({
  type: "DESELECT_ROUTE_IN_TAB",
  payload: { routeId },
})

export interface FlipLadderInTabAction {
  type: "FLIP_LADDER_IN_TAB"
  payload: {
    routeId: RouteId
  }
}

export const flipLadderInTab = (routeId: RouteId): FlipLadderInTabAction => ({
  type: "FLIP_LADDER_IN_TAB",
  payload: { routeId },
})

export interface ToggleLadderCrowdingInTabAction {
  type: "TOGGLE_LADDER_CROWDING_IN_TAB"
  payload: {
    routeId: RouteId
  }
}

export const toggleLadderCrowdingInTab = (
  routeId: RouteId
): ToggleLadderCrowdingInTabAction => ({
  type: "TOGGLE_LADDER_CROWDING_IN_TAB",
  payload: { routeId },
})

export interface StartingRouteTabsPushAction {
  type: "STARTING_ROUTE_TABS_PUSH"
}

export const startingRouteTabsPush = (): StartingRouteTabsPushAction => ({
  type: "STARTING_ROUTE_TABS_PUSH",
})

export interface RouteTabsPushCompleteAction {
  type: "ROUTE_TABS_PUSH_COMPLETE"
}

export const routeTabsPushComplete = (): RouteTabsPushCompleteAction => ({
  type: "ROUTE_TABS_PUSH_COMPLETE",
})

export interface RetryRouteTabsPushIfNotOutdatedAction {
  type: "RETRY_ROUTE_TABS_PUSH_IF_NOT_OUTDATED"
  payload: { routeTabsToRetry: RouteTab[] }
}

export const retryRouteTabsPushIfNotOutdated = (
  routeTabsToRetry: RouteTab[]
): RetryRouteTabsPushIfNotOutdatedAction => ({
  type: "RETRY_ROUTE_TABS_PUSH_IF_NOT_OUTDATED",
  payload: { routeTabsToRetry },
})

interface SelectShuttleRunAction {
  type: "SELECT_SHUTTLE_RUN"
  payload: {
    runId: RunId
  }
}

export const selectShuttleRun = (runId: RunId): SelectShuttleRunAction => ({
  type: "SELECT_SHUTTLE_RUN",
  payload: {
    runId,
  },
})

interface DeselectShuttleRunAction {
  type: "DESELECT_SHUTTLE_RUN"
  payload: {
    runId: RunId
  }
}

export const deselectShuttleRun = (runId: RunId): DeselectShuttleRunAction => ({
  type: "DESELECT_SHUTTLE_RUN",
  payload: {
    runId,
  },
})

interface SelectAllShuttleRunsAction {
  type: "SELECT_ALL_SHUTTLE_RUNS"
}

export const selectAllShuttleRuns = (): SelectAllShuttleRunsAction => ({
  type: "SELECT_ALL_SHUTTLE_RUNS",
})

interface DeselectAllShuttleRunsAction {
  type: "DESELECT_ALL_SHUTTLE_RUNS"
}

export const deselectAllShuttleRuns = (): DeselectAllShuttleRunsAction => ({
  type: "DESELECT_ALL_SHUTTLE_RUNS",
})

interface SelectShuttleRouteAction {
  type: "SELECT_SHUTTLE_ROUTE"
  payload: {
    routeId: RouteId
  }
}

export const selectShuttleRoute = (
  routeId: RouteId
): SelectShuttleRouteAction => ({
  type: "SELECT_SHUTTLE_ROUTE",
  payload: {
    routeId,
  },
})

interface DeselectShuttleRouteAction {
  type: "DESELECT_SHUTTLE_ROUTE"
  payload: {
    routeId: RouteId
  }
}

export const deselectShuttleRoute = (
  routeId: RouteId
): DeselectShuttleRouteAction => ({
  type: "DESELECT_SHUTTLE_ROUTE",
  payload: {
    routeId,
  },
})

export interface SelectVehicleAction {
  type: "SELECT_VEHICLE"
  payload: {
    vehicle: VehicleOrGhost | null | undefined
  }
}

export const selectVehicle = (
  vehicle: VehicleOrGhost | null | undefined
): SelectVehicleAction => ({
  type: "SELECT_VEHICLE",
  payload: { vehicle },
})

export interface DeselectVehicleAction {
  type: "DESELECT_VEHICLE"
}

export const deselectVehicle = (): DeselectVehicleAction => ({
  type: "DESELECT_VEHICLE",
})

interface TogglePickerContainerAction {
  type: "TOGGLE_PICKER_CONTAINER"
}

export const togglePickerContainer = (): TogglePickerContainerAction => ({
  type: "TOGGLE_PICKER_CONTAINER",
})

interface OpenNotificationDrawerAction {
  type: "OPEN_NOTIFICATION_DRAWER"
}

export const openNotificationDrawer = (): OpenNotificationDrawerAction => ({
  type: "OPEN_NOTIFICATION_DRAWER",
})

interface CloseNotificationDrawerAction {
  type: "CLOSE_NOTIFICATION_DRAWER"
}

export const closeNotificationDrawer = (): CloseNotificationDrawerAction => ({
  type: "CLOSE_NOTIFICATION_DRAWER",
})

interface SetLadderVehicleLabelSettingAction {
  type: "SET_LADDER_VEHICLE_LABEL_SETTING"
  payload: {
    ladderVehicleLabel: VehicleLabelSetting
  }
}

export const setLadderVehicleLabelSetting = (
  ladderVehicleLabel: VehicleLabelSetting
): SetLadderVehicleLabelSettingAction => ({
  type: "SET_LADDER_VEHICLE_LABEL_SETTING",
  payload: {
    ladderVehicleLabel,
  },
})

interface SetShuttleVehicleLabelSettingAction {
  type: "SET_MAP_VEHICLE_LABEL_SETTING"
  payload: {
    shuttleVehicleLabel: VehicleLabelSetting
  }
}

export const setShuttleVehicleLabelSetting = (
  shuttleVehicleLabel: VehicleLabelSetting
): SetShuttleVehicleLabelSettingAction => ({
  type: "SET_MAP_VEHICLE_LABEL_SETTING",
  payload: {
    shuttleVehicleLabel,
  },
})

interface SetVehicleAdherenceColorsSettingAction {
  type: "SET_VEHICLE_ADHERENCE_COLORS_SETTING"
  payload: {
    vehicleAdherenceColors: VehicleAdherenceColorsSetting
  }
}

export const setVehicleAdherenceColorsSetting = (
  vehicleAdherenceColors: VehicleAdherenceColorsSetting
): SetVehicleAdherenceColorsSettingAction => ({
  type: "SET_VEHICLE_ADHERENCE_COLORS_SETTING",
  payload: {
    vehicleAdherenceColors,
  },
})

interface SetNotificationAction {
  type: "SET_NOTIFICATION"
  payload: {
    selectedNotification?: Notification
  }
}

export const setNotification = (
  selectedNotification?: Notification
): SetNotificationAction => ({
  type: "SET_NOTIFICATION",
  payload: {
    selectedNotification,
  },
})

interface OpenSwingsViewAction {
  type: "OPEN_SWINGS_VIEW"
}

export const openSwingsView = (): OpenSwingsViewAction => ({
  type: "OPEN_SWINGS_VIEW",
})

interface CloseSwingsViewAction {
  type: "CLOSE_SWINGS_VIEW"
}

export const closeSwingsView = (): CloseSwingsViewAction => ({
  type: "CLOSE_SWINGS_VIEW",
})

interface OpenLateViewAction {
  type: "OPEN_LATE_VIEW"
}

export const openLateView = (): OpenLateViewAction => ({
  type: "OPEN_LATE_VIEW",
})

interface CloseLateViewAction {
  type: "CLOSE_LATE_VIEW"
}

export const closeLateView = (): CloseLateViewAction => ({
  type: "CLOSE_LATE_VIEW",
})

interface ReturnToPreviousViewAction {
  type: "RETURN_TO_PREVIOUS_VIEW"
}

export const returnToPreviousView = (): ReturnToPreviousViewAction => ({
  type: "RETURN_TO_PREVIOUS_VIEW",
})

interface SelectVehicleFromNotificationAction {
  type: "SELECT_VEHICLE_FROM_NOTIFICATION"
  payload: { vehicle: VehicleOrGhost | null | undefined }
}

export const selectVehicleFromNotification = (
  vehicle: VehicleOrGhost | null | undefined
): SelectVehicleFromNotificationAction => ({
  type: "SELECT_VEHICLE_FROM_NOTIFICATION",
  payload: { vehicle },
})

interface CreatePresetAction {
  type: "CREATE_PRESET"
  payload: { uuid: string; presetName: string }
}

export const createPreset = (
  uuid: string,
  presetName: string
): CreatePresetAction => ({
  type: "CREATE_PRESET",
  payload: { uuid, presetName },
})

interface InstantiatePresetAction {
  type: "INSTANTIATE_PRESET"
  payload: { uuid: string }
}

export const instantiatePreset = (uuid: string): InstantiatePresetAction => ({
  type: "INSTANTIATE_PRESET",
  payload: { uuid },
})

interface SavePresetAction {
  type: "SAVE_PRESET"
  payload: { uuid: string }
}

export const savePreset = (uuid: string): SavePresetAction => ({
  type: "SAVE_PRESET",
  payload: { uuid },
})

interface DeletePresetAction {
  type: "DELETE_PRESET"
  payload: { uuid: string }
}

export const deletePreset = (uuid: string): DeletePresetAction => ({
  type: "DELETE_PRESET",
  payload: { uuid },
})

interface PromptToSaveOrCreatePresetAction {
  type: "PROMPT_TO_SAVE_OR_CREATE_PRESET"
  payload: { routeTab: RouteTab }
}

export const promptToSaveOrCreatePreset = (
  routeTab: RouteTab
): PromptToSaveOrCreatePresetAction => ({
  type: "PROMPT_TO_SAVE_OR_CREATE_PRESET",
  payload: { routeTab },
})

interface PromptToDeletePresetAction {
  type: "PROMPT_TO_DELETE_PRESET"
  payload: { routeTab: RouteTab }
}

export const promptToDeletePreset = (
  routeTab: RouteTab
): PromptToDeletePresetAction => ({
  type: "PROMPT_TO_DELETE_PRESET",
  payload: { routeTab },
})

interface PromptToOverwritePresetAction {
  type: "PROMPT_TO_OVERWRITE_PRESET"
  payload: {
    presetName: string
    routeTabToSave: RouteTab
    uuidToOverwrite: string
  }
}

export const promptToOverwritePreset = (
  presetName: string,
  routeTabToSave: RouteTab,
  uuidToOverwrite: string
): PromptToOverwritePresetAction => ({
  type: "PROMPT_TO_OVERWRITE_PRESET",
  payload: { presetName, routeTabToSave, uuidToOverwrite },
})

interface CloseInputModalAction {
  type: "CLOSE_INPUT_MODAL"
}

export const closeInputModal = (): CloseInputModalAction => ({
  type: "CLOSE_INPUT_MODAL",
})

interface ToggleMobileMenuAction {
  type: "TOGGLE_MOBILE_MENU"
}

export const toggleMobileMenu = (): ToggleMobileMenuAction => ({
  type: "TOGGLE_MOBILE_MENU",
})

interface ToggleShowGaragesFilterAction {
  type: "TOGGLE_SHOW_GARAGES_FILTER"
}

export const toggleShowGaragesFilter = (): ToggleShowGaragesFilterAction => ({
  type: "TOGGLE_SHOW_GARAGES_FILTER",
})

export type Action =
  // Route tabs and ladder management in tabs
  | CreateRouteTabAction
  | CloseRouteTabAction
  | SelectRouteTabAction
  | SelectRouteInTabAction
  | DeselectRouteInTabAction
  | FlipLadderInTabAction
  | ToggleLadderCrowdingInTabAction
  // Route tab API push
  | StartingRouteTabsPushAction
  | RouteTabsPushCompleteAction
  | RetryRouteTabsPushIfNotOutdatedAction
  // Shuttles page
  | SelectShuttleRunAction
  | DeselectShuttleRunAction
  | SelectAllShuttleRunsAction
  | DeselectAllShuttleRunsAction
  | SelectShuttleRouteAction
  | DeselectShuttleRouteAction
  // Vehicle selection
  | SelectVehicleAction
  | DeselectVehicleAction
  // Opening / closing picker drawer
  | TogglePickerContainerAction
  // Settings
  | SetLadderVehicleLabelSettingAction
  | SetShuttleVehicleLabelSettingAction
  | SetVehicleAdherenceColorsSettingAction
  // Search
  | SearchAction
  // Notification selection
  | SetNotificationAction
  | SelectVehicleFromNotificationAction
  // Views
  | OpenNotificationDrawerAction
  | CloseNotificationDrawerAction
  | OpenSwingsViewAction
  | CloseSwingsViewAction
  | OpenLateViewAction
  | CloseLateViewAction
  | ReturnToPreviousViewAction
  // Presets
  | CreatePresetAction
  | InstantiatePresetAction
  | SavePresetAction
  | DeletePresetAction
  // Preset modals
  | PromptToSaveOrCreatePresetAction
  | PromptToDeletePresetAction
  | PromptToOverwritePresetAction
  // Input modals
  | CloseInputModalAction
  // Mobile Menu
  | ToggleMobileMenuAction
  // Routepicker Garage Filter
  | ToggleShowGaragesFilterAction

export type Dispatch = ReactDispatch<Action>

export type Reducer = (state: State, action: Action) => State

const shuttleRunIdsList = (selectedShuttleRunIds: RunId[] | "all"): RunId[] =>
  selectedShuttleRunIds === "all" ? [] : selectedShuttleRunIds

const pickerContainerIsVisibleReducer = (
  state: boolean,
  action: Action
): boolean => {
  switch (action.type) {
    case "TOGGLE_PICKER_CONTAINER":
      return !state
    default:
      return state
  }
}

const routeTabsReducer = (
  routeTabs: RouteTab[],
  action: Action
): {
  newRouteTabs: RouteTab[]
  routeTabsUpdated: boolean
} => {
  const currentTab = currentRouteTab(routeTabs)

  switch (action.type) {
    case "CREATE_ROUTE_TAB":
      return {
        newRouteTabs: [
          ...routeTabs.map((existingRouteTab) => {
            return {
              ...existingRouteTab,
              isCurrentTab: false,
            }
          }),
          newRouteTab(highestExistingOrdering(routeTabs) + 1),
        ],
        routeTabsUpdated: true,
      }
    case "CLOSE_ROUTE_TAB":
      return {
        newRouteTabs: closeTabByUUID(routeTabs, action.payload.uuid),
        routeTabsUpdated: true,
      }
    case "CREATE_PRESET":
      return {
        newRouteTabs: routeTabs.map((existingRouteTab) => {
          if (existingRouteTab.uuid === action.payload.uuid) {
            return {
              ...existingRouteTab,
              presetName: action.payload.presetName,
            }
          } else {
            return existingRouteTab
          }
        }),
        routeTabsUpdated: true,
      }
    case "INSTANTIATE_PRESET":
      return {
        newRouteTabs: instantiatePresetByUUID(routeTabs, action.payload.uuid),
        routeTabsUpdated: true,
      }
    case "SAVE_PRESET":
      return {
        newRouteTabs: saveEditedPreset(routeTabs, action.payload.uuid),
        routeTabsUpdated: true,
      }
    case "DELETE_PRESET":
      return {
        newRouteTabs: deletePresetByUUID(routeTabs, action.payload.uuid),
        routeTabsUpdated: true,
      }
    case "SELECT_ROUTE_TAB":
      return {
        newRouteTabs: selectTabByUUID(routeTabs, action.payload.uuid),
        routeTabsUpdated: true,
      }
    case "SELECT_VEHICLE_FROM_NOTIFICATION": {
      const routeId = action.payload.vehicle?.routeId

      if (routeId) {
        if (currentRouteTab(routeTabs)?.selectedRouteIds.includes(routeId)) {
          return { newRouteTabs: routeTabs, routeTabsUpdated: false }
        }

        const tabToOpen = findFirstOpenTabWith(routeTabs, (routeTab) =>
          routeTab.selectedRouteIds.includes(routeId)
        )

        if (tabToOpen) {
          return {
            newRouteTabs: selectTabByUUID(routeTabs, tabToOpen.uuid),
            routeTabsUpdated: true,
          }
        }
      }
      return { newRouteTabs: routeTabs, routeTabsUpdated: false }
    }
    case "SELECT_ROUTE_IN_TAB":
      return {
        newRouteTabs: currentTab
          ? applyRouteTabEdit(routeTabs, currentTab.uuid, (editTab) => {
              return {
                ...editTab,
                selectedRouteIds: [
                  ...editTab.selectedRouteIds,
                  action.payload.routeId,
                ],
              }
            })
          : routeTabs,
        routeTabsUpdated: true,
      }
    case "DESELECT_ROUTE_IN_TAB":
      return {
        newRouteTabs: currentTab
          ? applyRouteTabEdit(routeTabs, currentTab.uuid, (editTab) => {
              return {
                ...editTab,
                selectedRouteIds: editTab.selectedRouteIds.filter(
                  (routeId) => routeId !== action.payload.routeId
                ),
              }
            })
          : routeTabs,
        routeTabsUpdated: true,
      }
    case "FLIP_LADDER_IN_TAB":
      return {
        newRouteTabs: currentTab
          ? applyRouteTabEdit(routeTabs, currentTab.uuid, (editTab) => {
              return {
                ...editTab,
                ladderDirections: flipLadderDirectionForRoute(
                  editTab.ladderDirections,
                  action.payload.routeId
                ),
              }
            })
          : routeTabs,
        routeTabsUpdated: true,
      }
    case "TOGGLE_LADDER_CROWDING_IN_TAB":
      return {
        newRouteTabs: currentTab
          ? applyRouteTabEdit(routeTabs, currentTab.uuid, (editTab) => {
              return {
                ...editTab,
                ladderCrowdingToggles: toggleLadderCrowdingForRoute(
                  editTab.ladderCrowdingToggles,
                  action.payload.routeId
                ),
              }
            })
          : routeTabs,
        routeTabsUpdated: true,
      }
    default:
      return { newRouteTabs: routeTabs, routeTabsUpdated: false }
  }
}

const routeTabsPushInProgressReducer = (
  routeTabsPushInProgress: boolean,
  action: Action
): boolean => {
  switch (action.type) {
    case "STARTING_ROUTE_TABS_PUSH":
      return true
    case "ROUTE_TABS_PUSH_COMPLETE":
      return false
    case "RETRY_ROUTE_TABS_PUSH_IF_NOT_OUTDATED":
      return false
    default:
      return routeTabsPushInProgress
  }
}

/**
 * @returns tuple of routeTabsToPush, routeTabsToPushNext
 */
const routeTabsToPushReducer = (
  routeTabsToPush: RouteTab[] | null,
  routeTabsToPushNext: RouteTab[] | null,
  newRouteTabs: RouteTab[],
  routeTabsUpdated: boolean,
  action: Action
): [RouteTab[] | null, RouteTab[] | null] => {
  switch (action.type) {
    case "STARTING_ROUTE_TABS_PUSH":
      return [routeTabsToPushNext, null]
    case "RETRY_ROUTE_TABS_PUSH_IF_NOT_OUTDATED":
      return routeTabsToPush
        ? [routeTabsToPush, routeTabsToPushNext]
        : [action.payload.routeTabsToRetry, null]
    default:
      return routeTabsUpdated
        ? routeTabsToPush
          ? [routeTabsToPush, newRouteTabs]
          : [newRouteTabs, null]
        : [routeTabsToPush, routeTabsToPushNext]
  }
}

const routeTabsAndPushReducer = (
  {
    routeTabs,
    routeTabsToPush,
    routeTabsToPushNext,
    routeTabsPushInProgress,
  }: {
    routeTabs: RouteTab[]
    routeTabsToPush: RouteTab[] | null
    routeTabsToPushNext: RouteTab[] | null
    routeTabsPushInProgress: boolean
  },
  action: Action
): {
  routeTabs: RouteTab[]
  routeTabsToPush: RouteTab[] | null
  routeTabsToPushNext: RouteTab[] | null
  routeTabsPushInProgress: boolean
} => {
  const { newRouteTabs, routeTabsUpdated } = routeTabsReducer(routeTabs, action)

  const newRouteTabsPushInProgress = routeTabsPushInProgressReducer(
    routeTabsPushInProgress,
    action
  )

  const [newRouteTabsToPush, newRouteTabsToPushNext] = routeTabsToPushReducer(
    routeTabsToPush,
    routeTabsToPushNext,
    newRouteTabs,
    routeTabsUpdated,
    action
  )

  return {
    routeTabs: newRouteTabs,
    routeTabsToPush: newRouteTabsToPush,
    routeTabsToPushNext: newRouteTabsToPushNext,
    routeTabsPushInProgress: newRouteTabsPushInProgress,
  }
}

const selectedShuttleRouteIdsReducer = (
  state: RouteId[],
  action: Action
): RouteId[] => {
  switch (action.type) {
    case "SELECT_SHUTTLE_ROUTE":
      return [...state, action.payload.routeId]
    case "DESELECT_SHUTTLE_ROUTE":
      return state.filter((id) => id !== action.payload.routeId)
    default:
      return state
  }
}

const selectedShuttleRunIdsReducer = (
  state: RunId[] | "all",
  action: Action
): RunId[] | "all" => {
  switch (action.type) {
    case "SELECT_SHUTTLE_RUN":
      return [...shuttleRunIdsList(state), action.payload.runId]
    case "DESELECT_SHUTTLE_RUN":
      return shuttleRunIdsList(state).filter(
        (id) => id !== action.payload.runId
      )
    case "SELECT_ALL_SHUTTLE_RUNS":
      return "all"
    case "DESELECT_ALL_SHUTTLE_RUNS":
      return []
    default:
      return state
  }
}

const openViewPanelReducer = (
  openView: OpenView,
  previousView: OpenView,
  selectedVehicleOrGhost: VehicleOrGhost | null | undefined,
  action: Action
): {
  openView: OpenView
  previousView: OpenView
  selectedVehicleOrGhost: VehicleOrGhost | null | undefined
} => {
  switch (action.type) {
    case "OPEN_NOTIFICATION_DRAWER":
      return openView === OpenView.NotificationDrawer
        ? { openView, previousView, selectedVehicleOrGhost }
        : {
            openView: OpenView.NotificationDrawer,
            previousView: openView,
            selectedVehicleOrGhost: undefined,
          }
    case "CLOSE_NOTIFICATION_DRAWER":
      return openView === OpenView.NotificationDrawer
        ? {
            openView: OpenView.None,
            previousView: openView,
            selectedVehicleOrGhost,
          }
        : {
            openView,
            previousView,
            selectedVehicleOrGhost,
          }
    case "OPEN_SWINGS_VIEW":
      return openView === OpenView.Swings
        ? {
            openView,
            previousView,
            selectedVehicleOrGhost,
          }
        : {
            openView: OpenView.Swings,
            previousView: openView,
            selectedVehicleOrGhost: undefined,
          }
    case "CLOSE_SWINGS_VIEW":
      return openView === OpenView.Swings
        ? {
            openView: OpenView.None,
            previousView: openView,
            selectedVehicleOrGhost,
          }
        : { openView, previousView, selectedVehicleOrGhost }
    case "OPEN_LATE_VIEW":
      return openView === OpenView.Late
        ? { openView, previousView, selectedVehicleOrGhost }
        : {
            openView: OpenView.Late,
            previousView: openView,
            selectedVehicleOrGhost: undefined,
          }
    case "CLOSE_LATE_VIEW":
      return openView === OpenView.Late
        ? {
            openView: OpenView.None,
            previousView: openView,
            selectedVehicleOrGhost,
          }
        : { openView, previousView, selectedVehicleOrGhost }
    case "SELECT_VEHICLE":
    case "SELECT_VEHICLE_FROM_NOTIFICATION":
      return {
        openView: featureIsEnabled("nav_beta") ? OpenView.None : openView,
        previousView: openView === OpenView.None ? previousView : openView,
        selectedVehicleOrGhost: action.payload.vehicle,
      }
    case "DESELECT_VEHICLE":
    case "SET_NOTIFICATION":
      return {
        openView,
        previousView: previousView,
        selectedVehicleOrGhost: undefined,
      }
    case "RETURN_TO_PREVIOUS_VIEW":
      return previousView !== OpenView.None
        ? {
            openView: previousView,
            previousView: OpenView.None,
            selectedVehicleOrGhost: undefined,
          }
        : {
            openView,
            previousView,
            selectedVehicleOrGhost,
          }
    default:
      return { openView, previousView, selectedVehicleOrGhost }
  }
}

const mobileMenuReducer = (state: boolean, action: Action): boolean => {
  switch (action.type) {
    case "TOGGLE_MOBILE_MENU":
      return !state
    default:
      return state
  }
}

const garageFilterReducer = (state: boolean, action: Action): boolean => {
  switch (action.type) {
    case "TOGGLE_SHOW_GARAGES_FILTER":
      return !state
    default:
      return state
  }
}

const userSettingsReducer = (
  state: UserSettings,
  action: Action
): UserSettings => {
  switch (action.type) {
    case "SET_LADDER_VEHICLE_LABEL_SETTING":
      return {
        ...state,
        ladderVehicleLabel: action.payload.ladderVehicleLabel,
      }
    case "SET_MAP_VEHICLE_LABEL_SETTING":
      return {
        ...state,
        shuttleVehicleLabel: action.payload.shuttleVehicleLabel,
      }
    case "SET_VEHICLE_ADHERENCE_COLORS_SETTING":
      return {
        ...state,
        vehicleAdherenceColors: action.payload.vehicleAdherenceColors,
      }
    default:
      return state
  }
}

const selectedNotificationReducer = (
  state: Notification | undefined,
  action: Action
): Notification | undefined => {
  switch (action.type) {
    case "SELECT_VEHICLE":
    case "DESELECT_VEHICLE":
    case "RETURN_TO_PREVIOUS_VIEW":
      return undefined
    case "SET_NOTIFICATION":
      return action.payload.selectedNotification
    default:
      return state
  }
}

const openInputModalReducer = (
  state: OpenInputModal | null,
  action: Action
): OpenInputModal | null => {
  switch (action.type) {
    case "CLOSE_INPUT_MODAL":
      return null
    case "PROMPT_TO_SAVE_OR_CREATE_PRESET":
      if (isEditedPreset(action.payload.routeTab)) {
        return {
          type: "SAVE_PRESET",
          saveCallback: (dispatch: React.Dispatch<Action>) => {
            dispatch(savePreset(action.payload.routeTab.uuid))
          },
          presetName: action.payload.routeTab.presetName || "",
        }
      } else if (!isPreset(action.payload.routeTab)) {
        return {
          type: "CREATE_PRESET",
          createCallback: (
            presetName: string,
            dispatch: React.Dispatch<Action>
          ) => {
            dispatch(createPreset(action.payload.routeTab.uuid, presetName))
          },
          confirmOverwriteCallback: (
            presetName: string,
            existingPresetUuid: string,
            dispatch: React.Dispatch<Action>
          ) => {
            dispatch(
              promptToOverwritePreset(
                presetName,
                action.payload.routeTab,
                existingPresetUuid
              )
            )
          },
        }
      } else {
        return state
      }
    case "PROMPT_TO_DELETE_PRESET":
      return {
        type: "DELETE_PRESET",
        deleteCallback: (dispatch: React.Dispatch<Action>) => {
          dispatch(deletePreset(action.payload.routeTab.uuid))
        },
        presetName: action.payload.routeTab.presetName || "",
      }
    case "PROMPT_TO_OVERWRITE_PRESET":
      return {
        type: "OVERWRITE_PRESET",
        confirmCallback: (dispatch: React.Dispatch<Action>) => {
          dispatch(deletePreset(action.payload.uuidToOverwrite))
          dispatch(
            createPreset(
              action.payload.routeTabToSave.uuid,
              action.payload.presetName
            )
          )
        },
        presetName: action.payload.presetName,
      }
    default:
      return state
  }
}

export const reducer = (state: State, action: Action): State => {
  const {
    routeTabs,
    routeTabsToPush,
    routeTabsToPushNext,
    routeTabsPushInProgress,
  } = routeTabsAndPushReducer(state, action)

  const { openView, previousView, selectedVehicleOrGhost } =
    openViewPanelReducer(
      state.openView,
      state.previousView,
      state.selectedVehicleOrGhost,
      action
    )

  return {
    pickerContainerIsVisible: pickerContainerIsVisibleReducer(
      state.pickerContainerIsVisible,
      action
    ),
    searchPageState: searchReducer(
      state.searchPageState,
      action as SearchAction
    ),
    routeTabs,
    routeTabsToPush,
    routeTabsToPushNext,
    routeTabsPushInProgress,
    selectedShuttleRouteIds: selectedShuttleRouteIdsReducer(
      state.selectedShuttleRouteIds,
      action
    ),
    selectedShuttleRunIds: selectedShuttleRunIdsReducer(
      state.selectedShuttleRunIds,
      action
    ),
    selectedVehicleOrGhost: selectedVehicleOrGhost,
    userSettings: userSettingsReducer(state.userSettings, action),
    selectedNotification: selectedNotificationReducer(
      state.selectedNotification,
      action
    ),
    openView,
    previousView,
    openInputModal: openInputModalReducer(state.openInputModal, action),
    mobileMenuIsOpen: mobileMenuReducer(state.mobileMenuIsOpen, action),
    showGaragesFilter: garageFilterReducer(state.showGaragesFilter, action),
  }
}
