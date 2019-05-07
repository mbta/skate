import { Dispatch as ReactDispatch } from "react"
import { RouteId, Vehicle } from "./skate.d"

export interface State {
  selectedRouteIds: RouteId[]
  selectedVehicle?: Vehicle
}

export const initialState: State = {
  selectedRouteIds: [],
  selectedVehicle: undefined,
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
    vehicle: Vehicle
  }
}

export const selectVehicle = (vehicle: Vehicle): SelectVehicleAction => ({
  type: "SELECT_VEHICLE",
  payload: { vehicle },
})

interface DeselectVehicleAction {
  type: "DESELECT_VEHICLE"
}

export const deselectVehicle = (): DeselectVehicleAction => ({
  type: "DESELECT_VEHICLE",
})

type Action =
  | SelectRouteAction
  | DeselectRouteAction
  | SelectVehicleAction
  | DeselectVehicleAction

export type Dispatch = ReactDispatch<Action>

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
        selectedVehicle: action.payload.vehicle,
      }
    case "DESELECT_VEHICLE":
      return {
        ...state,
        selectedVehicle: undefined,
      }
    default:
      return state
  }
}
