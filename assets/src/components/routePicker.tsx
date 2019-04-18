import React, { useContext } from "react"
import DispatchContext from "../contexts/dispatchContext"
import { Route, RouteId } from "../skate.d"
import { deselectRoute, selectRoute } from "../state"
import Loading from "./loading"

interface Props {
  routes: null | Route[]
  selectedRouteIds: RouteId[]
}

const RoutePicker = ({ routes, selectedRouteIds }: Props) => (
  <div className="m-route-picker">
    <h2>Selected Routes</h2>
    {selectedRouteIds.length === 0 ? (
      "none"
    ) : (
      <SelectedRoutesList selectedRouteIds={selectedRouteIds} />
    )}

    <h2>Routes</h2>
    {routes === null ? (
      <Loading />
    ) : (
      <RoutesList routes={routes} selectedRouteIds={selectedRouteIds} />
    )}
  </div>
)

const SelectedRoutesList = ({
  selectedRouteIds,
}: {
  selectedRouteIds: RouteId[]
}) => {
  const dispatch = useContext(DispatchContext)

  return (
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
}

const RoutesList = ({
  routes,
  selectedRouteIds,
}: {
  routes: Route[]
  selectedRouteIds: RouteId[]
}) => {
  const dispatch = useContext(DispatchContext)

  return (
    <ul>
      {routes.map(route => (
        <li key={route.id}>
          {selectedRouteIds.includes(route.id) ? (
            <button
              className="m-route-picker__route-list-button--selected"
              onClick={() => dispatch(deselectRoute(route.id))}
            >
              *{route.id}
            </button>
          ) : (
            <button
              className="m-route-picker__route-list-button--deselected"
              onClick={() => dispatch(selectRoute(route.id))}
            >
              {route.id}
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

export default RoutePicker
