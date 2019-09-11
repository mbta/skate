import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import {
  filterRoutes,
  RouteFilter,
  RouteFilterData,
  useRouteFilter,
} from "../hooks/useRouteFilter"
import { Route, RouteId } from "../schedule.d"
import { deselectRoute, selectRoute } from "../state"
import Loading from "./loading"
import PickerContainer from "./pickerContainer"

interface Props {
  routes: null | Route[]
  selectedRouteIds: RouteId[]
}

const RoutePicker = ({ routes, selectedRouteIds }: Props) => {
  const routeFilterData: RouteFilterData = useRouteFilter()

  const filteredRoutes = filterRoutes(routes || [], routeFilterData)

  return (
    <PickerContainer>
      <div className="m-route-picker">
        <SelectedRoutesList selectedRouteIds={selectedRouteIds} />

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
  selectedRouteIds,
}: {
  selectedRouteIds: RouteId[]
}) => {
  const [, dispatch] = useContext(StateDispatchContext)

  return (
    <ul className="m-route-picker__selected-routes">
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
}) => (
  <ul className="m-route-picker__route-list">
    {routes.map(route => (
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
