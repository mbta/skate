import React, { useContext, useState } from "react"
import DispatchContext from "../contexts/dispatchContext"
import { collapseIcon, expandIcon } from "../helpers/icon"
import {
  filterRoutes,
  RouteFilter,
  RouteFilterData,
  useRouteFilter,
} from "../hooks/useRouteFilter"
import { Route, RouteId } from "../skate.d"
import { deselectRoute, selectRoute } from "../state"
import Loading from "./loading"

interface Props {
  routes: null | Route[]
  selectedRouteIds: RouteId[]
}

const RoutePicker = ({ routes, selectedRouteIds }: Props) => {
  const routeFilterData: RouteFilterData = useRouteFilter()
  const [isVisible, setIsVisible] = useState(true)

  const filteredRoutes = filterRoutes(routes || [], routeFilterData)

  const toggleVisibility = () => setIsVisible(!isVisible)

  return (
    <div className={`m-route-picker ${isVisible ? "visible" : "hidden"}`}>
      <Tab isVisible={isVisible} toggleVisibility={toggleVisibility} />

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
  )
}

const Tab = ({
  isVisible,
  toggleVisibility,
}: {
  isVisible: boolean
  toggleVisibility: () => void
}) => (
  <div className="m-route-picker__tab">
    <button className="m-route-picker__tab-button" onClick={toggleVisibility}>
      {isVisible
        ? collapseIcon("m-route-picker__tab-button-icon")
        : expandIcon("m-route-picker__tab-button-icon")}
    </button>
  </div>
)

const SelectedRoutesList = ({
  selectedRouteIds,
}: {
  selectedRouteIds: RouteId[]
}) => {
  const dispatch = useContext(DispatchContext)

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
  const dispatch = useContext(DispatchContext)
  const selectedClass = isSelected
    ? "m-route-picker__route-list-button--selected"
    : ""
  const clickHandler = isSelected
    ? () => dispatch(deselectRoute(route.id))
    : () => dispatch(selectRoute(route.id))

  return (
    <button
      className={`m-route-picker__route-list-button ${selectedClass}`}
      onClick={clickHandler}
    >
      {route.id}
    </button>
  )
}

export default RoutePicker
