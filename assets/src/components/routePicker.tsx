import React from "react"
import { Route, RouteId } from "../skate.d"
import { deselectRoute, Dispatch, selectRoute } from "../state"

interface Props {
  routes: null | Route[]
  selectedRouteIds: RouteId[]
  dispatch: Dispatch
}

const RoutePicker = ({ routes, selectedRouteIds, dispatch }: Props) => (
  <div className="m-route-picker">
    <h2>Selected Routes</h2>
    {selectedRouteIds.length === 0
      ? "none"
      : selectedRoutesList(selectedRouteIds, dispatch)
    }

    <h2>Routes</h2>
    {routes === null
      ? "loading..."
      : routesList(routes, selectedRouteIds, dispatch)
    }
  </div>
)

const selectedRoutesList = (selectedRouteIds: RouteId[], dispatch: Dispatch) => (
  <ul>
    {selectedRouteIds.map(routeId => (
      <li key={routeId}>
        <button
          className="m-route-picker__selected-routes-button"
          onClick={() => dispatch(deselectRoute(routeId))}
        >
          {routeId}
        </button>
      </li>
    ))}
  </ul>
)

const routesList = (routes: Route[], selectedRouteIds: RouteId[], dispatch: Dispatch) => (
  <ul>
    {routes.map(route => (
      <li key={route.id}>
        {selectedRouteIds.includes(route.id)
          ? <button
            className="m-route-picker__route-list-button--selected"
            onClick={() => dispatch(deselectRoute(route.id))}
          >
            *{route.id}
          </button>
          : <button
            className="m-route-picker__route-list-button--deselected"
            onClick={() => dispatch(selectRoute(route.id))}
          >
            {route.id}
          </button>
        }
      </li>
    ))}
  </ul>
)

export default RoutePicker
