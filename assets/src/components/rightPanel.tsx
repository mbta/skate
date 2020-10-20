import * as Sentry from "@sentry/react"
import React, { ReactElement, useContext, useEffect } from "react"
import { useHistory } from "react-router-dom"
import RoutesContext from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useVehicleAndRouteForNotification from "../hooks/useVehicleAndRouteForNotification"
import { VehicleOrGhost, VehicleOrGhostAndRoute } from "../realtime.d"
import { Route } from "../schedule.d"
import {
  setNotification,
  setNotificationIsInactive,
  setNotificationIsLoading,
} from "../state"
import PropertiesPanel from "./propertiesPanel"

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

const RightPanel = ({
  selectedVehicleOrGhost,
}: {
  selectedVehicleOrGhost?: VehicleOrGhost
}): ReactElement<HTMLElement> | null => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const { selectedNotification } = state

  const routes: Route[] | null = useContext(RoutesContext)

  const vehicleAndRouteForNotification = useVehicleAndRouteForNotification(
    selectedNotification
  )
  useEffect(() => {
    if (vehicleAndRouteForNotification === null) {
      dispatch(setNotificationIsInactive())
    } else if (
      vehicleAndRouteForNotification === undefined &&
      selectedNotification
    ) {
      dispatch(setNotificationIsLoading(true))
    } else if (vehicleAndRouteForNotification) {
      dispatch(setNotificationIsLoading(false))
    }
  }, [vehicleAndRouteForNotification, selectedNotification])
  const history = useHistory()
  if (history) {
    /* istanbul ignore next */
    history.listen(() => dispatch(setNotification(undefined)))
  }

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

  return vehicleOrGhostForVPP && routeForVPP ? (
    <PropertiesPanel
      selectedVehicleOrGhost={vehicleOrGhostForVPP}
      route={routeForVPP}
    />
  ) : null
}

export default RightPanel
