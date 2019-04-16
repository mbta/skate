import { Dispatch as ReactDispatch } from "react"
import { Route, RouteId, Timepoint, TimepointsByRouteId } from "./skate.d"

export interface State {
  routes: null | Route[]
  selectedRouteIds: RouteId[]
  timepointsByRouteId: TimepointsByRouteId
}

export const initialState: State = {
  routes: null,
  selectedRouteIds: [],
  timepointsByRouteId: {},
}

interface SetRoutesAction {
  type: "SET_ROUTES"
  payload: {
    routes: Route[]
  }
}

export const setRoutes = (routes: Route[]): SetRoutesAction => ({
  type: "SET_ROUTES",
  payload: { routes },
})

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

interface SetLoadingTimepointsForRouteAction {
  type: "SET_LOADING_TIMEPOINTS_FOR_ROUTE"
  payload: {
    routeId: RouteId
  }
}

export const setLoadingTimepointsForRoute = (
  routeId: RouteId
): SetLoadingTimepointsForRouteAction => ({
  type: "SET_LOADING_TIMEPOINTS_FOR_ROUTE",
  payload: { routeId },
})

interface SetTimepointsForRouteAction {
  type: "SET_TIMEPOINTS_FOR_ROUTE"
  payload: {
    routeId: RouteId
    timepoints: Timepoint[]
  }
}

export const setTimepointsForRoute = (
  routeId: RouteId,
  timepoints: Timepoint[]
): SetTimepointsForRouteAction => ({
  type: "SET_TIMEPOINTS_FOR_ROUTE",
  payload: { routeId, timepoints },
})

type Action =
  | SetRoutesAction
  | SelectRouteAction
  | DeselectRouteAction
  | SetLoadingTimepointsForRouteAction
  | SetTimepointsForRouteAction

export type Dispatch = ReactDispatch<Action>

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_ROUTES":
      return {
        ...state,
        routes: action.payload.routes,
      }
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
    case "SET_LOADING_TIMEPOINTS_FOR_ROUTE":
      return {
        ...state,
        timepointsByRouteId: {
          ...state.timepointsByRouteId,
          [action.payload.routeId]: null,
        },
      }
    case "SET_TIMEPOINTS_FOR_ROUTE":
      return {
        ...state,
        timepointsByRouteId: {
          ...state.timepointsByRouteId,
          [action.payload.routeId]: action.payload.timepoints,
        },
      }
    default:
      return state
  }
}
