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
import PickerContainer from "./pickerContainer"
import {
  GarageFilterData,
  useGarageFilter,
  GarageFilter,
  filterRoutesByGarage,
} from "../hooks/useGarageFilter"
import featureIsEnabled from "../laboratoryFeatures"

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

  const filteredRoutes = filterRoutesByGarage(
    filterRoutes(routes || [], routeFilterData),
    garageFilterData
  )

  return (
    <PickerContainer>
      <div className="m-route-picker">
        <SelectedRoutesList
          routes={routes}
          selectedRouteIds={selectedRouteIds}
          deselectRoute={deselectRoute}
        />

        <RouteFilter {...routeFilterData} />

        {featureIsEnabled("presets_workspaces") ? (
          <GarageFilter {...garageFilterData} />
        ) : null}

        {routes === null ? (
          <Loading />
        ) : (
          <RoutesList
            routes={filteredRoutes}
            selectedRouteIds={selectedRouteIds}
            selectRoute={selectRoute}
            deselectRoute={deselectRoute}
          />
        )}
      </div>
    </PickerContainer>
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
      </button>
    </li>
  )
}

const RoutesList = ({
  routes,
  selectedRouteIds,
  selectRoute,
  deselectRoute,
}: {
  routes: Route[]
  selectedRouteIds: RouteId[]
  selectRoute: (routeId: RouteId) => void
  deselectRoute: (routeId: RouteId) => void
}) => (
  <ul className="m-route-picker__route-list">
    {routes.map((route) => (
      <li key={route.id}>
        <RouteListButton
          route={route}
          isSelected={selectedRouteIds.includes(route.id)}
          selectRoute={selectRoute}
          deselectRoute={deselectRoute}
        />
      </li>
    ))}
  </ul>
)

const RouteListButton = ({
  route,
  isSelected,
  selectRoute,
  deselectRoute,
}: {
  route: Route
  isSelected: boolean
  selectRoute: (routeId: RouteId) => void
  deselectRoute: (routeId: RouteId) => void
}) => {
  const selectedClass = isSelected
    ? "m-route-picker__route-list-button--selected"
    : "m-route-picker__route-list-button--unselected"
  const clickHandler = isSelected
    ? () => deselectRoute(route.id)
    : () => selectRoute(route.id)

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
