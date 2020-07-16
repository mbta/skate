import React, { Dispatch, useContext } from "react"
import RoutesContext from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import {
  filterRoutes,
  RouteFilter,
  RouteFilterData,
  useRouteFilter,
} from "../hooks/useRouteFilter"
import { Route, RouteId } from "../schedule.d"
import { deselectRoute, DeselectRouteAction, selectRoute } from "../state"
import { routeNameOrId } from "../util/route"
import Loading from "./loading"
import PickerContainer from "./pickerContainer"

interface Props {
  selectedRouteIds: RouteId[]
}

const RoutePicker = ({ selectedRouteIds }: Props) => {
  const routes = useContext(RoutesContext)
  const routeFilterData: RouteFilterData = useRouteFilter()

  const filteredRoutes = filterRoutes(routes || [], routeFilterData)

  return (
    <PickerContainer>
      <div className="m-route-picker">
        <SelectedRoutesList
          routes={routes}
          selectedRouteIds={selectedRouteIds}
        />

        <RouteFilter {...routeFilterData} />

        {routes === null ? (
          <Loading />
        ) : (
          <RoutesList
            routes={filteredRoutes}
            selectedRouteIds={selectedRouteIds}
          />
        )}
      </div>
    </PickerContainer>
  )
}

const SelectedRoutesList = ({
  routes,
  selectedRouteIds,
}: {
  routes: Route[] | null
  selectedRouteIds: RouteId[]
}) => {
  const [, dispatch] = useContext(StateDispatchContext)

  return (
    <ul className="m-route-picker__selected-routes">
      {selectedRouteIds.map((routeId) => (
        <SelectedRouteButton
          key={routeId}
          routeId={routeId}
          routes={routes}
          dispatch={dispatch}
        />
      ))}
    </ul>
  )
}

const SelectedRouteButton = ({
  routeId,
  routes,
  dispatch,
}: {
  routeId: RouteId
  routes: Route[] | null
  dispatch: Dispatch<DeselectRouteAction>
}) => {
  return (
    <li>
      <button
        className="m-route-picker__selected-routes-button"
        onClick={() => dispatch(deselectRoute(routeId))}
      >
        {routeNameOrId(routeId, routes)}
      </button>
    </li>
  )
}

const RoutesList = ({
  routes,
  selectedRouteIds,
}: {
  routes: Route[]
  selectedRouteIds: RouteId[]
}) => (
  <ul className="m-route-picker__route-list">
    {routes.map((route) => (
      <li key={route.id}>
        <RouteListButton
          route={route}
          isSelected={selectedRouteIds.includes(route.id)}
        />
      </li>
    ))}
  </ul>
)

const RouteListButton = ({
  route,
  isSelected,
}: {
  route: Route
  isSelected: boolean
}) => {
  const [, dispatch] = useContext(StateDispatchContext)
  const selectedClass = isSelected
    ? "m-route-picker__route-list-button--selected"
    : "m-route-picker__route-list-button--unselected"
  const clickHandler = isSelected
    ? () => dispatch(deselectRoute(route.id))
    : () => dispatch(selectRoute(route.id))

  return (
    <button
      className={`m-route-picker__route-list-button ${selectedClass}`}
      onClick={clickHandler}
    >
      {route.name}
    </button>
  )
}

export default RoutePicker
