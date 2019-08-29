import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { VehiclesByRouteIdContext } from "../contexts/vehiclesByRouteIdContext"
import useRoutes from "../hooks/useRoutes"
import useTimepoints from "../hooks/useTimepoints"
import { findGhostById, findVehicleById } from "../models/vehiclesByRouteId"
import { Ghost, Vehicle, VehicleId, VehiclesForRoute } from "../realtime.d"
import { ByRouteId, Route, RouteId, TimepointsByRouteId } from "../schedule.d"
import RouteLadders from "./routeLadders"
import RoutePicker from "./routePicker"
import VehiclePropertiesPanel, {
  GhostPropertiesPanel,
} from "./vehiclePropertiesPanel"

export const findRouteById = (
  routes: Route[] | null,
  routeId: RouteId
): Route | undefined => (routes || []).find(route => route.id === routeId)

const panel = (
  vehiclesByRouteId: ByRouteId<VehiclesForRoute>,
  selectedVehicleId: VehicleId,
  routes: Route[] | null
): JSX.Element | undefined => {
  if (selectedVehicleId.startsWith("ghost-")) {
    const ghost: Ghost | undefined = findGhostById(
      vehiclesByRouteId,
      selectedVehicleId
    )
    const route: Route | undefined =
      ghost && findRouteById(routes, ghost.routeId)
    return ghost && <GhostPropertiesPanel ghost={ghost} route={route} />
  } else {
    const vehicle: Vehicle | undefined = findVehicleById(
      vehiclesByRouteId,
      selectedVehicleId
    )
    const route: Route | undefined =
      vehicle && findRouteById(routes, vehicle.routeId)
    return (
      vehicle && (
        <VehiclePropertiesPanel
          selectedVehicle={vehicle}
          selectedVehicleRoute={route}
        />
      )
    )
  }
}

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

  return (
    <div className="m-ladder-page">
      <RoutePicker routes={routes} selectedRouteIds={selectedRouteIds} />

      <RouteLadders
        routes={selectedRoutes}
        timepointsByRouteId={timepointsByRouteId}
        selectedVehicleId={selectedVehicleId}
      />

      {selectedVehicleId &&
        panel(vehiclesByRouteId, selectedVehicleId, routes || [])}
    </div>
  )
}

export default LadderPage
