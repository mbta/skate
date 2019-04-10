import { Dispatch as ReactDispatch } from "react"
import { Route, RouteId } from "./skate.d"

export interface State {
  routes: null | Route[]
  selectedRouteIds: RouteId[]
}

export const initialState: State = {
  routes: null,
  selectedRouteIds: [],
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

type Action = SetRoutesAction | SelectRouteAction | DeselectRouteAction

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
        selectedRouteIds: state.selectedRouteIds
          .filter(id => id !== action.payload.routeId),
      }
    default:
      return state
  }
}
