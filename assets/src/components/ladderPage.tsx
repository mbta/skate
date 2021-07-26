import React, { ReactElement, useContext } from "react"
import RoutesContext from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useTimepoints from "../hooks/useTimepoints"
import { allVehiclesAndGhosts } from "../models/vehiclesByRouteId"
import { VehicleId, VehicleOrGhost } from "../realtime.d"
import { ByRouteId, Route, RouteId, TimepointsByRouteId } from "../schedule.d"
import { Notifications } from "./notifications"
import RightPanel from "./rightPanel"
import RouteLadders from "./routeLadders"
import RoutePicker from "./routePicker"

export const findRouteById = (
  routes: Route[] | null,
  routeId: RouteId
): Route | undefined => (routes || []).find((route) => route.id === routeId)

export const findSelectedVehicleOrGhost = (
  vehiclesByRouteId: ByRouteId<VehicleOrGhost[]>,
  selectedVehicleId: VehicleId | undefined
): VehicleOrGhost | undefined => {
  return allVehiclesAndGhosts(vehiclesByRouteId).find(
    (bus) => bus.id === selectedVehicleId
  )
}

const LadderPage = (): ReactElement<HTMLDivElement> => {
  const [state] = useContext(StateDispatchContext)
  const { selectedRouteIds, selectedVehicleOrGhost } = state

  const routes: Route[] | null = useContext(RoutesContext)
  const timepointsByRouteId: TimepointsByRouteId =
    useTimepoints(selectedRouteIds)

  const selectedRoutes: Route[] = selectedRouteIds
    .map((routeId) => findRouteById(routes, routeId))
    .filter((route) => route) as Route[]

  return (
    <div className="m-ladder-page">
      <Notifications />
      <RoutePicker selectedRouteIds={selectedRouteIds} />

      <>
        <RouteLadders
          routes={selectedRoutes}
          timepointsByRouteId={timepointsByRouteId}
          selectedVehicleId={selectedVehicleOrGhost?.id}
        />
        <RightPanel selectedVehicleOrGhost={selectedVehicleOrGhost} />
      </>
    </div>
  )
}

export default LadderPage
