import { Socket } from "phoenix"
import React, { ReactElement, useContext } from "react"
import RoutesContext from "../contexts/routesContext"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { VehiclesByRouteIdProvider } from "../contexts/vehiclesByRouteIdContext"
import useRoutes from "../hooks/useRoutes"
import useTimepoints from "../hooks/useTimepoints"
import useVehicles from "../hooks/useVehicles"
import { allVehiclesAndGhosts } from "../models/vehiclesByRouteId"
import { VehicleId, VehicleOrGhost } from "../realtime.d"
import { ByRouteId, Route, RouteId, TimepointsByRouteId } from "../schedule.d"
import { Notifications } from "./notifications"
import PropertiesPanel from "./propertiesPanel"
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

const vehicleRoute = (
  allRoutes: Route[] | null,
  vehicleOrGhost: VehicleOrGhost | undefined
): Route | undefined =>
  (allRoutes || []).find(
    (route) => route.id === (vehicleOrGhost && vehicleOrGhost.routeId)
  )

const LadderPage = (): ReactElement<HTMLDivElement> => {
  const [state] = useContext(StateDispatchContext)
  const { selectedRouteIds, selectedVehicleId } = state

  const routes: Route[] | null = useRoutes()
  const timepointsByRouteId: TimepointsByRouteId = useTimepoints(
    selectedRouteIds
  )

  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const vehiclesByRouteId: ByRouteId<VehicleOrGhost[]> = useVehicles(
    socket,
    selectedRouteIds
  )
  const selectedRoutes: Route[] = selectedRouteIds
    .map((routeId) => findRouteById(routes, routeId))
    .filter((route) => route) as Route[]

  const selectedVehicleOrGhost = findSelectedVehicleOrGhost(
    vehiclesByRouteId,
    selectedVehicleId
  )

  return (
    <RoutesContext.Provider value={routes}>
      <div className="m-ladder-page">
        <Notifications />
        <RoutePicker selectedRouteIds={selectedRouteIds} />

        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <>
            <RouteLadders
              routes={selectedRoutes}
              timepointsByRouteId={timepointsByRouteId}
              selectedVehicleId={selectedVehicleId}
            />

            {selectedVehicleOrGhost && (
              <PropertiesPanel
                selectedVehicleOrGhost={selectedVehicleOrGhost}
                route={vehicleRoute(routes, selectedVehicleOrGhost)}
              />
            )}
          </>
        </VehiclesByRouteIdProvider>
      </div>
    </RoutesContext.Provider>
  )
}

export default LadderPage
