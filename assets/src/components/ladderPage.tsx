import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { VehiclesByRouteIdContext } from "../contexts/vehiclesByRouteIdContext"
import useRoutes from "../hooks/useRoutes"
import useTimepoints from "../hooks/useTimepoints"
import { allVehiclesAndGhosts } from "../models/vehiclesByRouteId"
import { VehicleId, VehicleOrGhost, VehiclesForRoute } from "../realtime.d"
import { ByRouteId, Route, RouteId, TimepointsByRouteId } from "../schedule.d"
import PropertiesPanel from "./propertiesPanel"
import RouteLadders from "./routeLadders"
import RoutePicker from "./routePicker"

export const findRouteById = (
  routes: Route[] | null,
  routeId: RouteId
): Route | undefined => (routes || []).find(route => route.id === routeId)

export const findSelectedVehicleOrGhost = (
  vehiclesByRouteId: ByRouteId<VehiclesForRoute>,
  selectedVehicleId: VehicleId | undefined
): VehicleOrGhost | undefined => {
  const vehiclesAndGhosts: VehicleOrGhost[] = Object.values(
    vehiclesByRouteId
  ).reduce(
    (acc, vehiclesForRoute) =>
      acc.concat(allVehiclesAndGhosts(vehiclesForRoute)),
    [] as VehicleOrGhost[]
  )
  return vehiclesAndGhosts.find(bus => bus.id === selectedVehicleId)
}

const vehicleRoute = (
  allRoutes: Route[] | null,
  vehicleOrGhost: VehicleOrGhost | undefined
): Route | undefined =>
  (allRoutes || []).find(
    route => route.id === (vehicleOrGhost && vehicleOrGhost.routeId)
  )

const LadderPage = (): ReactElement<HTMLDivElement> => {
  const [state] = useContext(StateDispatchContext)
  const { selectedRouteIds, selectedVehicleId } = state

  const routes: Route[] | null = useRoutes()
  const timepointsByRouteId: TimepointsByRouteId = useTimepoints(
    selectedRouteIds
  )

  const vehiclesByRouteId: ByRouteId<VehiclesForRoute> = useContext(
    VehiclesByRouteIdContext
  )
  const selectedRoutes: Route[] = selectedRouteIds
    .map(routeId => findRouteById(routes, routeId))
    .filter(route => route) as Route[]

  const selectedVehicleOrGhost = findSelectedVehicleOrGhost(
    vehiclesByRouteId,
    selectedVehicleId
  )

  return (
    <div className="m-ladder-page">
      <RoutePicker routes={routes} selectedRouteIds={selectedRouteIds} />

      <RouteLadders
        routes={selectedRoutes}
        timepointsByRouteId={timepointsByRouteId}
        selectedVehicleId={selectedVehicleId}
      />

      {selectedVehicleOrGhost && (
        <PropertiesPanel
          selectedVehicleOrGhost={selectedVehicleOrGhost}
          selectedVehicleRoute={vehicleRoute(routes, selectedVehicleOrGhost)}
        />
      )}
    </div>
  )
}

export default LadderPage
