import { Dispatch as ReactDispatch } from "react"
import { RunId, VehicleId } from "./realtime.d"
import { RouteId } from "./schedule.d"
import { defaultSettings, Settings, VehicleLabelSetting } from "./settings"

export interface State {
  pickerContainerIsVisible: boolean
  selectedRouteIds: RouteId[]
  selectedShuttleRouteIds: RouteId[]
  selectedShuttleRunIds: RunId[] | "all"
  selectedVehicleId?: VehicleId
  settings: Settings
}

export const initialState: State = {
  pickerContainerIsVisible: true,
  selectedRouteIds: [],
  selectedShuttleRouteIds: [],
  selectedShuttleRunIds: "all",
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
  | SelectShuttleRouteAction
  | DeselectShuttleRouteAction
  | SelectVehicleAction
  | DeselectVehicleAction
  | TogglePickerContainerAction
  | SetLadderVehicleLabelSettingAction
  | SetShuttleVehicleLabelSettingAction

export type Dispatch = ReactDispatch<Action>

export type Reducer = (state: State, action: Action) => State

const shuttleRunIdsList = (selectedShuttleRunIds: RunId[] | "all"): RunId[] =>
  selectedShuttleRunIds === "all" ? [] : selectedShuttleRunIds

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SELECT_ROUTE":
      return {
        ...state,
        selectedRouteIds: [...state.selectedRouteIds, action.payload.routeId],
      }
    case "DESELECT_ROUTE":
      return {
        ...state,
        selectedRouteIds: state.selectedRouteIds.filter(
          id => id !== action.payload.routeId
        ),
      }
    case "SELECT_SHUTTLE_RUN":
      return {
        ...state,
        selectedShuttleRunIds: [
          ...shuttleRunIdsList(state.selectedShuttleRunIds),
          action.payload.runId,
        ],
      }
    case "DESELECT_SHUTTLE_RUN":
      return {
        ...state,
        selectedShuttleRunIds: shuttleRunIdsList(
          state.selectedShuttleRunIds
        ).filter(id => id !== action.payload.runId),
      }
    case "SELECT_ALL_SHUTTLE_RUNS":
      return {
        ...state,
        selectedShuttleRunIds: "all",
      }
    case "DESELECT_ALL_SHUTTLE_RUNS":
      return {
        ...state,
        selectedShuttleRunIds: [],
      }
    case "SELECT_SHUTTLE_ROUTE":
      return {
        ...state,
        selectedShuttleRouteIds: [
          ...state.selectedShuttleRouteIds,
          action.payload.routeId,
        ],
      }
    case "DESELECT_SHUTTLE_ROUTE":
      return {
        ...state,
        selectedShuttleRouteIds: state.selectedShuttleRouteIds.filter(
          id => id !== action.payload.routeId
        ),
      }
    case "SELECT_VEHICLE":
      return action.payload.vehicleId.startsWith("ghost-")
        ? state
        : {
            ...state,
            selectedVehicleId: action.payload.vehicleId,
          }
    case "DESELECT_VEHICLE":
      return {
        ...state,
        selectedVehicleId: undefined,
      }
    case "TOGGLE_PICKER_CONTAINER":
      return {
        ...state,
        pickerContainerIsVisible: !state.pickerContainerIsVisible,
      }
    case "SET_LADDER_VEHICLE_LABEL_SETTING":
      return {
        ...state,
        settings: {
          ...state.settings,
          ladderVehicleLabel: action.payload.ladderVehicleLabel,
        },
      }
    case "SET_MAP_VEHICLE_LABEL_SETTING":
      return {
        ...state,
        settings: {
          ...state.settings,
          shuttleVehicleLabel: action.payload.shuttleVehicleLabel,
        },
      }
    default:
      return state
  }
}
