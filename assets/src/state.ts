import { Dispatch as ReactDispatch } from "react"
import {
  emptyLadderCrowdingTogglesByRouteId,
  LadderCrowdingToggles,
  toggleLadderCrowdingForRoute,
} from "./models/ladderCrowdingToggle"
import {
  emptyLadderDirectionsByRouteId,
  flipLadderDirectionForRoute,
  LadderDirections,
} from "./models/ladderDirection"
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
} from "./models/routeTab"

export enum OpenView {
  None = 1,
  Swings,
  Late,
}

interface CreatePresetModal {
  type: "CREATE_PRESET"
  createCallback: (arg0: string, arg1: React.Dispatch<Action>) => void
}

interface SavePresetModal {
  type: "SAVE_PRESET"
  saveCallback: (arg0: React.Dispatch<Action>) => void
  presetName: string
}

interface DeletePresetModal {
  type: "DELETE_PRESET"
  deleteCallback: (arg1: React.Dispatch<Action>) => void
  presetName: string
}

export type OpenInputModal =
  | CreatePresetModal
  | SavePresetModal
  | DeletePresetModal

export interface State {
  pickerContainerIsVisible: boolean
  searchPageState: SearchPageState
  selectedRouteIds: RouteId[]
  ladderDirections: LadderDirections
  ladderCrowdingToggles: LadderCrowdingToggles
  routeTabs: RouteTab[]
  routeTabsToPush: RouteTab[] | null
  routeTabsToPushNext: RouteTab[] | null
  routeTabsPushInProgress: boolean
  selectedShuttleRouteIds: RouteId[]
  selectedShuttleRunIds: RunId[] | "all"
  selectedVehicleOrGhost?: VehicleOrGhost | null
  notificationDrawerIsOpen: boolean
  userSettings: UserSettings
  selectedNotification?: Notification
  openView: OpenView
  openInputModal: OpenInputModal | null
}

export const initialState: State = {
  pickerContainerIsVisible: true,
  searchPageState: initialSearchPageState,
  selectedRouteIds: [],
  ladderDirections: emptyLadderDirectionsByRouteId,
  ladderCrowdingToggles: emptyLadderCrowdingTogglesByRouteId,
  routeTabs: [],
  routeTabsToPush: null,
  routeTabsToPushNext: null,
  routeTabsPushInProgress: false,
  selectedShuttleRouteIds: [],
  selectedShuttleRunIds: "all",
  selectedVehicleOrGhost: undefined,
  notificationDrawerIsOpen: false,
  userSettings: defaultUserSettings,
  selectedNotification: undefined,
  openView: OpenView.None,
  openInputModal: null,
}

interface SelectRouteAction {
  type: "SELECT_ROUTE"
  payload: {
    routeId: RouteId
  }
}

export const selectRoute = (routeId: RouteId): SelectRouteAction => ({
  type: "SELECT_ROUTE",
  payload: { routeId },
})

export interface DeselectRouteAction {
  type: "DESELECT_ROUTE"
  payload: {
    routeId: RouteId
  }
}

export const deselectRoute = (routeId: RouteId): DeselectRouteAction => ({
  type: "DESELECT_ROUTE",
  payload: { routeId },
})

interface FlipLadderAction {
  type: "FLIP_LADDER"
  payload: {
    routeId: RouteId
  }
}

export const flipLadder = (routeId: RouteId): FlipLadderAction => ({
  type: "FLIP_LADDER",
  payload: { routeId },
})

interface ToggleLadderCrowdingAction {
  type: "TOGGLE_LADDER_CROWDING"
  payload: { routeId: RouteId }
}

export const toggleLadderCrowding = (
  routeId: RouteId
): ToggleLadderCrowdingAction => ({
  type: "TOGGLE_LADDER_CROWDING",
  payload: { routeId },
})

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

interface ToggleNotificationDrawerAction {
  type: "TOGGLE_NOTIFICATION_DRAWER"
}

export const toggleNotificationDrawer = (): ToggleNotificationDrawerAction => ({
  type: "TOGGLE_NOTIFICATION_DRAWER",
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

interface ToggleSwingsViewAction {
  type: "TOGGLE_SWINGS_VIEW"
}

export const toggleSwingsView = (): ToggleSwingsViewAction => ({
  type: "TOGGLE_SWINGS_VIEW",
})

interface ToggleLateViewAction {
  type: "TOGGLE_LATE_VIEW"
}

export const toggleLateView = (): ToggleLateViewAction => ({
  type: "TOGGLE_LATE_VIEW",
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

interface CloseInputModalAction {
  type: "CLOSE_INPUT_MODAL"
}

export const closeInputModal = (): CloseInputModalAction => ({
  type: "CLOSE_INPUT_MODAL",
})

export type Action =
  // Route ladder management
  | SelectRouteAction
  | DeselectRouteAction
  | FlipLadderAction
  | ToggleLadderCrowdingAction
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
  // Notifications
  | OpenNotificationDrawerAction
  | CloseNotificationDrawerAction
  | ToggleNotificationDrawerAction
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
  | ToggleSwingsViewAction
  | ToggleLateViewAction
  // Presets
  | CreatePresetAction
  | InstantiatePresetAction
  | SavePresetAction
  | DeletePresetAction
  // Preset modals
  | PromptToSaveOrCreatePresetAction
  | PromptToDeletePresetAction
  // Input modals
  | CloseInputModalAction

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

const selectedRouteIdsReducer = (
  state: RouteId[],
  action: Action
): RouteId[] => {
  switch (action.type) {
    case "SELECT_ROUTE":
      return [...state, action.payload.routeId]
    case "DESELECT_ROUTE":
      return state.filter((id) => id !== action.payload.routeId)
    default:
      return state
  }
}

const ladderDirectionsReducer = (
  state: LadderDirections,
  action: Action
): LadderDirections => {
  switch (action.type) {
    case "FLIP_LADDER":
      const routeId = action.payload.routeId
      return flipLadderDirectionForRoute(state, routeId)
    default:
      return state
  }
}

const ladderCrowdingTogglesReducer = (
  state: LadderCrowdingToggles,
  action: Action
): LadderCrowdingToggles => {
  switch (action.type) {
    case "TOGGLE_LADDER_CROWDING":
      const routeId = action.payload.routeId
      return toggleLadderCrowdingForRoute(state, routeId)
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
        newRouteTabs: routeTabs.map((existingRouteTab) => {
          if (existingRouteTab.uuid === action.payload.uuid) {
            return { ...existingRouteTab, isCurrentTab: true }
          } else {
            return { ...existingRouteTab, isCurrentTab: false }
          }
        }),
        routeTabsUpdated: true,
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

const selectedVehicleOrGhostReducer = (
  state: VehicleOrGhost | null | undefined,
  action: Action
): VehicleOrGhost | null | undefined => {
  switch (action.type) {
    case "SELECT_VEHICLE":
    case "SELECT_VEHICLE_FROM_NOTIFICATION":
      return action.payload.vehicle
    case "DESELECT_VEHICLE":
    case "SET_NOTIFICATION":
      return undefined
    default:
      return state
  }
}

const notificationDrawerReducer = (state: boolean, action: Action): boolean => {
  switch (action.type) {
    case "OPEN_NOTIFICATION_DRAWER":
      return true
    case "CLOSE_NOTIFICATION_DRAWER":
      return false
    case "TOGGLE_NOTIFICATION_DRAWER":
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
      return undefined
    case "SET_NOTIFICATION":
      return action.payload.selectedNotification
    default:
      return state
  }
}

const openViewReducer = (state: OpenView, action: Action): OpenView => {
  switch (action.type) {
    case "TOGGLE_SWINGS_VIEW":
      if (state === OpenView.Swings) {
        return OpenView.None
      } else {
        return OpenView.Swings
      }
    case "TOGGLE_LATE_VIEW":
      if (state === OpenView.Late) {
        return OpenView.None
      } else {
        return OpenView.Late
      }
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

  return {
    pickerContainerIsVisible: pickerContainerIsVisibleReducer(
      state.pickerContainerIsVisible,
      action
    ),
    searchPageState: searchReducer(
      state.searchPageState,
      action as SearchAction
    ),
    selectedRouteIds: selectedRouteIdsReducer(state.selectedRouteIds, action),
    ladderDirections: ladderDirectionsReducer(state.ladderDirections, action),
    ladderCrowdingToggles: ladderCrowdingTogglesReducer(
      state.ladderCrowdingToggles,
      action
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
    selectedVehicleOrGhost: selectedVehicleOrGhostReducer(
      state.selectedVehicleOrGhost,
      action
    ),
    notificationDrawerIsOpen: notificationDrawerReducer(
      state.notificationDrawerIsOpen,
      action
    ),
    userSettings: userSettingsReducer(state.userSettings, action),
    selectedNotification: selectedNotificationReducer(
      state.selectedNotification,
      action
    ),
    openView: openViewReducer(state.openView, action),
    openInputModal: openInputModalReducer(state.openInputModal, action),
  }
}
