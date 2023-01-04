import React, { useContext } from "react"
import RoutesContext from "../contexts/routesContext"
import {
  filterRoutes,
  RouteFilter,
  RouteFilterData,
  useRouteFilter,
} from "../hooks/useRouteFilter"
import { Route, RouteId } from "../schedule.d"
import { routeNameOrId } from "../util/route"
import Loading from "./loading"
import {
  GarageFilterData,
  useGarageFilter,
  GarageFilter,
  filterRoutesByGarage,
} from "../hooks/useGarageFilter"
import { OldCloseIcon } from "../helpers/icon"

interface Props {
  selectedRouteIds: RouteId[]
  selectRoute: (routeId: RouteId) => void
  deselectRoute: (routeId: RouteId) => void
}

const RoutePicker = ({
  selectedRouteIds,
  selectRoute,
  deselectRoute,
}: Props) => {
  const routes = useContext(RoutesContext)
  const routeFilterData: RouteFilterData = useRouteFilter()
  const garageFilterData: GarageFilterData = useGarageFilter(routes)

  const selectableRoutes = filterRoutesByGarage(
    filterRoutes(routes || [], routeFilterData),
    garageFilterData
  ).filter((route) => !selectedRouteIds.includes(route.id))

  return (
    <div className="m-route-picker">
      <RouteFilter {...routeFilterData} />

      <GarageFilter {...garageFilterData} />

      <div className="m-route-picker__routes-container">
        {routes === null ? (
          <Loading />
        ) : (
          <RoutesList
            routes={selectableRoutes}
            selectRoute={selectRoute}
            deselectRoute={deselectRoute}
          />
        )}

        <SelectedRoutesList
          routes={routes}
          selectedRouteIds={selectedRouteIds}
          deselectRoute={deselectRoute}
        />
      </div>
    </div>
  )
}

const SelectedRoutesList = ({
  routes,
  selectedRouteIds,
  deselectRoute,
}: {
  routes: Route[] | null
  selectedRouteIds: RouteId[]
  deselectRoute: (routeId: RouteId) => void
}) => {
  if (selectedRouteIds.length > 0) {
    return (
      <ul className="m-route-picker__selected-routes">
        {selectedRouteIds.map((routeId) => (
          <SelectedRouteButton
            key={routeId}
            routeId={routeId}
            routes={routes}
            deselectRoute={deselectRoute}
          />
        ))}
      </ul>
    )
  } else {
    return <p>Selected routes will show up here&hellip;</p>
  }
}

const SelectedRouteButton = ({
  routeId,
  routes,
  deselectRoute,
}: {
  routeId: RouteId
  routes: Route[] | null
  deselectRoute: (routeId: RouteId) => void
}) => {
  return (
    <li>
      <button
        className="m-route-picker__selected-routes-button"
        onClick={() => deselectRoute(routeId)}
      >
        {routeNameOrId(routeId, routes)}
        <OldCloseIcon className="m-route-picker__selected-routes-button-icon" />
      </button>
    </li>
  )
}

const RoutesList = ({
  routes,
  selectRoute,
}: {
  routes: Route[]
  selectRoute: (routeId: RouteId) => void
  deselectRoute: (routeId: RouteId) => void
}) => (
  <ul className="m-route-picker__route-list">
    {routes.map((route) => (
      <li key={route.id}>
        <RouteListButton route={route} selectRoute={selectRoute} />
      </li>
    ))}
  </ul>
)

const RouteListButton = ({
  route,
  selectRoute,
}: {
  route: Route
  selectRoute: (routeId: RouteId) => void
}) => {
  return (
    <button
      className="m-route-picker__route-list-button"
      onClick={() => selectRoute(route.id)}
    >
      {route.name}
    </button>
  )
}

export default RoutePicker
