import * as Sentry from "@sentry/react"
import { Socket } from "phoenix"
import React, { ReactElement, useContext, useEffect } from "react"
import RoutesContext from "../contexts/routesContext"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { VehiclesByRouteIdProvider } from "../contexts/vehiclesByRouteIdContext"
import useRoutes from "../hooks/useRoutes"
import useTimepoints from "../hooks/useTimepoints"
import useVehicleAndRouteForNotification from "../hooks/useVehicleAndRouteForNotification"
import useVehicles from "../hooks/useVehicles"
import { allVehiclesAndGhosts } from "../models/vehiclesByRouteId"
import {
  VehicleId,
  VehicleOrGhost,
  VehicleOrGhostAndRoute,
} from "../realtime.d"
import { ByRouteId, Route, RouteId, TimepointsByRouteId } from "../schedule.d"
import { setNotificationIsInactive } from "../state"
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

export const chooseVehicleOrGhostForVPP = (
  vehicleAndRouteForNotification?: VehicleOrGhostAndRoute | null,
  selectedVehicleOrGhost?: VehicleOrGhost
): VehicleOrGhost | undefined =>
  vehicleAndRouteForNotification
    ? vehicleAndRouteForNotification.vehicleOrGhost
    : selectedVehicleOrGhost

const LadderPage = (): ReactElement<HTMLDivElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const { selectedRouteIds, selectedVehicleId, selectedNotification } = state

  const routes: Route[] | null = useRoutes()
  const timepointsByRouteId: TimepointsByRouteId = useTimepoints(
    selectedRouteIds
  )

  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const vehiclesByRouteId: ByRouteId<VehicleOrGhost[]> = useVehicles(
    socket,
    selectedRouteIds
  )

  const vehicleAndRouteForNotification = useVehicleAndRouteForNotification(
    selectedNotification
  )
  useEffect(() => {
    if (vehicleAndRouteForNotification === null) {
      dispatch(setNotificationIsInactive())
    }
  }, [vehicleAndRouteForNotification])

  const selectedRoutes: Route[] = selectedRouteIds
    .map((routeId) => findRouteById(routes, routeId))
    .filter((route) => route) as Route[]

  const selectedVehicleOrGhost = findSelectedVehicleOrGhost(
    vehiclesByRouteId,
    selectedVehicleId
  )

  const vehicleOrGhostForVPP:
    | VehicleOrGhost
    | undefined
    | null = chooseVehicleOrGhostForVPP(
    vehicleAndRouteForNotification,
    selectedVehicleOrGhost
  )

  const routeForVPP: Route | undefined = vehicleAndRouteForNotification
    ? vehicleAndRouteForNotification.route
    : selectedVehicleOrGhost && vehicleRoute(routes, selectedVehicleOrGhost)

  if (vehicleAndRouteForNotification && selectedVehicleOrGhost) {
    /* istanbul ignore next */
    Sentry.captureMessage(
      "vehicleAndRouteForNotification and selectedVehicleOrGhost both set, which should be impossible"
    )
  }

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

            {vehicleOrGhostForVPP && routeForVPP && (
              <PropertiesPanel
                selectedVehicleOrGhost={vehicleOrGhostForVPP}
                route={routeForVPP}
              />
            )}
          </>
        </VehiclesByRouteIdProvider>
      </div>
    </RoutesContext.Provider>
  )
}

export default LadderPage
