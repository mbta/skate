import { Dispatch as ReactDispatch } from "react"
import {
  Action as SearchAction,
  initialSearch as initialSearchState,
  reducer as searchReducer,
  Search,
} from "./models/search"
import {
  isMatchingShuttleRunSelection,
  ShuttleRunSelection,
} from "./models/shuttleRunSelection"
import { VehicleId } from "./realtime.d"
import { RouteId } from "./schedule.d"
import { defaultSettings, Settings, VehicleLabelSetting } from "./settings"

export interface State {
  pickerContainerIsVisible: boolean
  search: Search
  selectedRouteIds: RouteId[]
  selectedShuttleRouteIds: RouteId[]
  selectedShuttleRuns: ShuttleRunSelection[] | "all"
  selectedVehicleId?: VehicleId
  settings: Settings
}

export const initialState: State = {
  pickerContainerIsVisible: true,
  search: initialSearchState,
  selectedRouteIds: [],
  selectedShuttleRouteIds: [],
  selectedShuttleRuns: "all",
  selectedVehicleId: undefined,
  settings: defaultSettings,
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

interface DeselectRouteAction {
  type: "DESELECT_ROUTE"
  payload: {
    routeId: RouteId
  }
}

export const deselectRoute = (routeId: RouteId): DeselectRouteAction => ({
  type: "DESELECT_ROUTE",
  payload: { routeId },
})

interface SelectShuttleRunAction {
  type: "SELECT_SHUTTLE_RUN"
  payload: {
    shuttleRunSelection: ShuttleRunSelection
  }
}

export const selectShuttleRun = (
  shuttleRunSelection: ShuttleRunSelection
): SelectShuttleRunAction => ({
  type: "SELECT_SHUTTLE_RUN",
  payload: {
    shuttleRunSelection,
  },
})

interface DeselectShuttleRunAction {
  type: "DESELECT_SHUTTLE_RUN"
  payload: {
    shuttleRunSelection: ShuttleRunSelection
  }
}

export const deselectShuttleRun = (
  shuttleRunSelection: ShuttleRunSelection
): DeselectShuttleRunAction => ({
  type: "DESELECT_SHUTTLE_RUN",
  payload: {
    shuttleRunSelection,
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

interface SelectShuttleRouteIdAction {
  type: "SELECT_SHUTTLE_ROUTE_ID"
  payload: {
    routeId: RouteId
  }
}

export const selectShuttleRouteId = (
  routeId: RouteId
): SelectShuttleRouteIdAction => ({
  type: "SELECT_SHUTTLE_ROUTE_ID",
  payload: {
    routeId,
  },
})

interface DeselectShuttleRouteIdAction {
  type: "DESELECT_SHUTTLE_ROUTE_ID"
  payload: {
    routeId: RouteId
  }
}

export const deselectShuttleRouteId = (
  routeId: RouteId
): DeselectShuttleRouteIdAction => ({
  type: "DESELECT_SHUTTLE_ROUTE_ID",
  payload: {
    routeId,
  },
})

export interface SelectVehicleAction {
  type: "SELECT_VEHICLE"
  payload: {
    vehicleId: VehicleId
  }
}

export const selectVehicle = (vehicleId: VehicleId): SelectVehicleAction => ({
  type: "SELECT_VEHICLE",
  payload: { vehicleId },
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

type Action =
  | SelectRouteAction
  | DeselectRouteAction
  | SelectShuttleRunAction
  | DeselectShuttleRunAction
  | SelectAllShuttleRunsAction
  | DeselectAllShuttleRunsAction
  | SelectShuttleRouteIdAction
  | DeselectShuttleRouteIdAction
  | SelectVehicleAction
  | DeselectVehicleAction
  | TogglePickerContainerAction
  | SetLadderVehicleLabelSettingAction
  | SetShuttleVehicleLabelSettingAction
  | SearchAction

export type Dispatch = ReactDispatch<Action>

export type Reducer = (state: State, action: Action) => State

const shuttleRunsList = (
  selectedShuttleRuns: ShuttleRunSelection[] | "all"
): ShuttleRunSelection[] =>
  selectedShuttleRuns === "all" ? [] : selectedShuttleRuns

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
      return state.filter(id => id !== action.payload.routeId)
    default:
      return state
  }
}

const selectedShuttleRouteIdsReducer = (
  state: RouteId[],
  action: Action
): RouteId[] => {
  switch (action.type) {
    case "SELECT_SHUTTLE_ROUTE_ID":
      return [...state, action.payload.routeId]
    case "DESELECT_SHUTTLE_ROUTE_ID":
      return state.filter(id => id !== action.payload.routeId)
    default:
      return state
  }
}

const selectedShuttleRunsReducer = (
  state: ShuttleRunSelection[] | "all",
  action: Action
): ShuttleRunSelection[] | "all" => {
  switch (action.type) {
    case "SELECT_SHUTTLE_RUN":
      return [...shuttleRunsList(state), action.payload.shuttleRunSelection]
    case "DESELECT_SHUTTLE_RUN":
      return shuttleRunsList(state).filter(
        shuttleRun =>
          !isMatchingShuttleRunSelection(
            shuttleRun,
            action.payload.shuttleRunSelection
          )
      )
    case "SELECT_ALL_SHUTTLE_RUNS":
      return "all"
    case "DESELECT_ALL_SHUTTLE_RUNS":
      return []
    default:
      return state
  }
}

const selectedVehicleIdReducer = (
  state: VehicleId | undefined,
  action: Action
): VehicleId | undefined => {
  switch (action.type) {
    case "SELECT_VEHICLE":
      return action.payload.vehicleId
    case "DESELECT_VEHICLE":
      return undefined
    default:
      return state
  }
}

const settingsReducer = (state: Settings, action: Action): Settings => {
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
    default:
      return state
  }
}

export const reducer = (state: State, action: Action): State => ({
  pickerContainerIsVisible: pickerContainerIsVisibleReducer(
    state.pickerContainerIsVisible,
    action
  ),
  search: searchReducer(state.search, action as SearchAction),
  selectedRouteIds: selectedRouteIdsReducer(state.selectedRouteIds, action),
  selectedShuttleRouteIds: selectedShuttleRouteIdsReducer(
    state.selectedShuttleRouteIds,
    action
  ),
  selectedShuttleRuns: selectedShuttleRunsReducer(
    state.selectedShuttleRuns,
    action
  ),
  selectedVehicleId: selectedVehicleIdReducer(state.selectedVehicleId, action),
  settings: settingsReducer(state.settings, action),
})
