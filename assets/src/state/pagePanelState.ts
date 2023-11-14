import { Vehicle, Ghost } from "../realtime"
import { Action } from "../state"

/**
 * Valid "slots" in {@link ViewState}
 */
export enum PagePath {
  Ladders = "/",
  Shuttles = "/shuttle-map",
  Search = "/search",
  SearchMaps = "/map",
}

export function isPagePath(path: string): path is PagePath {
  return Object.values(PagePath).includes(path as PagePath)
}

/**
 * Keeps track of the current slot in use, and stores the state for each slot.
 */
export interface ViewState {
  currentPath: PagePath
  state: Record<PagePath, PageViewState>
}

/**
 * Valid {@link PageViewState.openView} states
 */
export enum OpenView {
  None = 1,
  Swings,
  Late,
  NotificationDrawer,
}

/**
 * State saved in each {@link ViewState} "slot".
 */
export type PageViewState = {
  openView: OpenView
  previousView: OpenView
  selectedVehicleOrGhost: VehicleType
}

export const initialPageState = {
  openView: OpenView.None,
  previousView: OpenView.None,
  selectedVehicleOrGhost: undefined,
}

export const initialPageViewState: ViewState = {
  currentPath: PagePath.Ladders,
  state: {
    [PagePath.Ladders]: initialPageState,
    [PagePath.Shuttles]: initialPageState,
    [PagePath.Search]: initialPageState,
    [PagePath.SearchMaps]: initialPageState,
  },
}

export type VehicleType = Vehicle | Ghost | null | undefined

//#region Reducers
export const openViewReducer = (
  currentState: ViewState,
  action: Action
): ViewState => {
  let currentPath = currentState.currentPath
  if (action.type === "SET_CURRENT_PATH") {
    currentPath = action.payload.path
  }

  return {
    currentPath,
    state: {
      ...currentState.state,
      [currentState.currentPath]: openViewPanelReducer(
        currentState.state[currentState.currentPath],
        action
      ),
    },
  }
}

const openViewPanelReducer = (
  state: PageViewState,
  action: Action
): PageViewState => {
  const { openView, previousView, selectedVehicleOrGhost } = state
  switch (action.type) {
    case "SET_CURRENT_PATH": {
      return {
        openView: OpenView.None,
        previousView: OpenView.None,
        selectedVehicleOrGhost,
      }
    }
    case "OPEN_NOTIFICATION_DRAWER":
      return openView === OpenView.NotificationDrawer
        ? state
        : {
            openView: OpenView.NotificationDrawer,
            previousView: openView,
            selectedVehicleOrGhost: undefined,
          }
    case "OPEN_SWINGS_VIEW":
      return openView === OpenView.Swings
        ? state
        : {
            openView: OpenView.Swings,
            previousView: openView,
            selectedVehicleOrGhost: undefined,
          }
    case "OPEN_LATE_VIEW":
      return openView === OpenView.Late
        ? state
        : {
            openView: OpenView.Late,
            previousView: openView,
            selectedVehicleOrGhost: undefined,
          }
    case "CLOSE_VIEW":
      return openView !== null
        ? {
            openView: OpenView.None,
            previousView: OpenView.None,
            selectedVehicleOrGhost: undefined,
          }
        : state
    case "SELECT_VEHICLE":
    case "SELECT_VEHICLE_FROM_NOTIFICATION":
      return {
        openView: OpenView.None,
        previousView: openView === OpenView.None ? previousView : openView,
        selectedVehicleOrGhost: action.payload.vehicle,
      }
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
        : state
    default:
      return state
  }
}
//#endregion Reducers

//#region Action Constructors
export const selectVehicle = (vehicle: VehicleType): SelectVehicleAction => {
  return {
    type: "SELECT_VEHICLE",
    payload: { vehicle },
  }
}

export const setPath = (path: PagePath): SetCurrentPath => {
  return {
    type: "SET_CURRENT_PATH",
    payload: { path },
  }
}

export const openPreviousView = (): ReturnToPreviousViewAction => {
  return {
    type: "RETURN_TO_PREVIOUS_VIEW",
  }
}

export const closeView = (): CloseViewAction => {
  return {
    type: "CLOSE_VIEW",
  }
}

export const openNotificaitonDrawer = (): OpenNotificationDrawerAction => {
  return {
    type: "OPEN_NOTIFICATION_DRAWER",
  }
}

export const openSwingsView = (): OpenSwingsViewAction => {
  return {
    type: "OPEN_SWINGS_VIEW",
  }
}

export const openLateView = (): OpenLateViewAction => {
  return {
    type: "OPEN_LATE_VIEW",
  }
}

export const selectVehicleFromNotification = (
  vehicle: VehicleType
): SelectVehicleFromNotificationAction => ({
  type: "SELECT_VEHICLE_FROM_NOTIFICATION",
  payload: { vehicle },
})
//#endregion Action Constructors

//#region Actions
export type PanelViewAction =
  // Path Sync
  | SetCurrentPath
  // Vehicles
  | SelectVehicleAction
  | SelectVehicleFromNotificationAction
  // Views
  | OpenNotificationDrawerAction
  | OpenSwingsViewAction
  | OpenLateViewAction
  | CloseViewAction
  | ReturnToPreviousViewAction

interface SetCurrentPath {
  type: "SET_CURRENT_PATH"
  payload: { path: PagePath }
}

interface SelectVehicleAction {
  type: "SELECT_VEHICLE"
  payload: {
    vehicle: VehicleType
  }
}

interface SelectVehicleFromNotificationAction {
  type: "SELECT_VEHICLE_FROM_NOTIFICATION"
  payload: { vehicle: VehicleType }
}

interface OpenNotificationDrawerAction {
  type: "OPEN_NOTIFICATION_DRAWER"
}

interface OpenSwingsViewAction {
  type: "OPEN_SWINGS_VIEW"
}

interface OpenLateViewAction {
  type: "OPEN_LATE_VIEW"
}

interface CloseViewAction {
  type: "CLOSE_VIEW"
}

interface ReturnToPreviousViewAction {
  type: "RETURN_TO_PREVIOUS_VIEW"
}

//#endregion Actions
