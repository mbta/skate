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
import { RouteTab, newRouteTab } from "./models/routeTab"

export enum OpenView {
  None = 1,
  Swings,
  Late,
}

export interface State {
  pickerContainerIsVisible: boolean
  searchPageState: SearchPageState
  selectedRouteIds: RouteId[]
  ladderDirections: LadderDirections
  ladderCrowdingToggles: LadderCrowdingToggles
  routeTabs: RouteTab[]
  pendingRouteTabs?: RouteTab[]
  selectedShuttleRouteIds: RouteId[]
  selectedShuttleRunIds: RunId[] | "all"
  selectedVehicleOrGhost?: VehicleOrGhost | null
  notificationDrawerIsOpen: boolean
  userSettings: UserSettings
  selectedNotification?: Notification
  openView: OpenView
}

export const initialState: State = {
  pickerContainerIsVisible: true,
  searchPageState: initialSearchPageState,
  selectedRouteIds: [],
  ladderDirections: emptyLadderDirectionsByRouteId,
  ladderCrowdingToggles: emptyLadderCrowdingTogglesByRouteId,
  routeTabs: [],
  pendingRouteTabs: undefined,
  selectedShuttleRouteIds: [],
  selectedShuttleRunIds: "all",
  selectedVehicleOrGhost: undefined,
  notificationDrawerIsOpen: false,
  userSettings: defaultUserSettings,
  selectedNotification: undefined,
  openView: OpenView.None,
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

interface SelectRouteTabAction {
  type: "SELECT_ROUTE_TAB"
  payload: {
    index: number
  }
}

export const selectRouteTab = (index: number): SelectRouteTabAction => ({
  type: "SELECT_ROUTE_TAB",
  payload: {
    index,
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

export interface UpdateRouteTabsAction {
  type: "UPDATE_ROUTE_TABS"
  payload: {
    routeTabs: RouteTab[]
  }
}

export const updateRouteTabs = (
  routeTabs: RouteTab[]
): UpdateRouteTabsAction => ({
  type: "UPDATE_ROUTE_TABS",
  payload: {
    routeTabs,
  },
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

export type Action =
  | SelectRouteAction
  | DeselectRouteAction
  | FlipLadderAction
  | ToggleLadderCrowdingAction
  | CreateRouteTabAction
  | SelectRouteTabAction
  | SelectRouteInTabAction
  | DeselectRouteInTabAction
  | FlipLadderInTabAction
  | ToggleLadderCrowdingInTabAction
  | UpdateRouteTabsAction
  | SelectShuttleRunAction
  | DeselectShuttleRunAction
  | SelectAllShuttleRunsAction
  | DeselectAllShuttleRunsAction
  | SelectShuttleRouteAction
  | DeselectShuttleRouteAction
  | SelectVehicleAction
  | DeselectVehicleAction
  | TogglePickerContainerAction
  | OpenNotificationDrawerAction
  | CloseNotificationDrawerAction
  | ToggleNotificationDrawerAction
  | SetLadderVehicleLabelSettingAction
  | SetShuttleVehicleLabelSettingAction
  | SetVehicleAdherenceColorsSettingAction
  | SearchAction
  | SetNotificationAction
  | ToggleSwingsViewAction
  | ToggleLateViewAction
  | SelectVehicleFromNotificationAction

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
  state: RouteTab[],
  action: Action
): [RouteTab[], RouteTab[] | undefined] => {
  switch (action.type) {
    case "CREATE_ROUTE_TAB":
      return [
        state,
        [
          ...state.map((existingRouteTab) => {
            return { ...existingRouteTab, isCurrentTab: false }
          }),
          newRouteTab(state.length),
        ],
      ]
    case "SELECT_ROUTE_TAB":
      const routeTabs = state.map((existingRouteTab, i) => {
        if (i === action.payload.index) {
          return { ...existingRouteTab, isCurrentTab: true }
        } else {
          return { ...existingRouteTab, isCurrentTab: false }
        }
      })

      return [state, routeTabs]
    case "SELECT_ROUTE_IN_TAB":
      return [
        state,
        state.map((routeTab) => {
          if (routeTab.isCurrentTab) {
            return {
              ...routeTab,
              selectedRouteIds: [
                ...routeTab.selectedRouteIds,
                action.payload.routeId,
              ],
            }
          } else {
            return routeTab
          }
        }),
      ]
    case "DESELECT_ROUTE_IN_TAB":
      return [
        state,
        state.map((routeTab) => {
          if (routeTab.isCurrentTab) {
            return {
              ...routeTab,
              selectedRouteIds: routeTab.selectedRouteIds.filter(
                (routeId) => routeId !== action.payload.routeId
              ),
            }
          } else {
            return routeTab
          }
        }),
      ]
    case "FLIP_LADDER_IN_TAB":
      return [
        state,
        state.map((routeTab) => {
          if (routeTab.isCurrentTab) {
            return {
              ...routeTab,
              ladderDirections: flipLadderDirectionForRoute(
                routeTab.ladderDirections,
                action.payload.routeId
              ),
            }
          } else {
            return routeTab
          }
        }),
      ]
    case "TOGGLE_LADDER_CROWDING_IN_TAB":
      return [
        state,
        state.map((routeTab) => {
          if (routeTab.isCurrentTab) {
            return {
              ...routeTab,
              ladderCrowdingToggles: toggleLadderCrowdingForRoute(
                routeTab.ladderCrowdingToggles,
                action.payload.routeId
              ),
            }
          } else {
            return routeTab
          }
        }),
      ]
    case "UPDATE_ROUTE_TABS":
      return [action.payload.routeTabs, undefined]
    default:
      return [state, undefined]
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

export const reducer = (state: State, action: Action): State => {
  const [routeTabs, pendingRouteTabs] = routeTabsReducer(
    state.routeTabs,
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
    selectedRouteIds: selectedRouteIdsReducer(state.selectedRouteIds, action),
    ladderDirections: ladderDirectionsReducer(state.ladderDirections, action),
    ladderCrowdingToggles: ladderCrowdingTogglesReducer(
      state.ladderCrowdingToggles,
      action
    ),
    routeTabs,
    pendingRouteTabs,
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
  }
}
