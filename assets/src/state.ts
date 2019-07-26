import { Dispatch as ReactDispatch } from "react"
import { RouteId, VehicleId } from "./skate.d"

export interface State {
  routePickerIsVisible: boolean
  selectedRouteIds: RouteId[]
  selectedVehicleId?: VehicleId
}

export const initialState: State = {
  routePickerIsVisible: true,
  selectedRouteIds: [],
  selectedVehicleId: undefined,
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

interface SelectVehicleAction {
  type: "SELECT_VEHICLE"
  payload: {
    vehicleId: VehicleId
  }
}

export const selectVehicle = (vehicleId: VehicleId): SelectVehicleAction => ({
  type: "SELECT_VEHICLE",
  payload: { vehicleId },
})

interface DeselectVehicleAction {
  type: "DESELECT_VEHICLE"
}

export const deselectVehicle = (): DeselectVehicleAction => ({
  type: "DESELECT_VEHICLE",
})

interface ToggleRoutePickerAction {
  type: "TOGGLE_ROUTE_PICKER"
}

export const toggleRoutePicker = (): ToggleRoutePickerAction => ({
  type: "TOGGLE_ROUTE_PICKER",
})

type Action =
  | SelectRouteAction
  | DeselectRouteAction
  | SelectVehicleAction
  | DeselectVehicleAction
  | ToggleRoutePickerAction

export type Dispatch = ReactDispatch<Action>

export type Reducer = (state: State, action: Action) => State

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
    case "SELECT_VEHICLE":
      return {
        ...state,
        selectedVehicleId: action.payload.vehicleId,
      }
    case "DESELECT_VEHICLE":
      return {
        ...state,
        selectedVehicleId: undefined,
      }
    case "TOGGLE_ROUTE_PICKER":
      return {
        ...state,
        routePickerIsVisible: !state.routePickerIsVisible,
      }
    default:
      return state
  }
}
