import * as Sentry from "@sentry/react"
import React, { ReactElement, useContext } from "react"
import { useHistory } from "react-router-dom"
import RoutesContext from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import VehicleAndRouteForNotificationContext from "../contexts/vehicleAndRouteForNotificationContext"
import { VehicleOrGhost } from "../realtime.d"
import { Route } from "../schedule.d"
import { setNotification } from "../state"
import PropertiesPanel from "./propertiesPanel"

const vehicleRoute = (
  allRoutes: Route[] | null,
  vehicleOrGhost: VehicleOrGhost | undefined
): Route | undefined =>
  (allRoutes || []).find(
    (route) => route.id === (vehicleOrGhost && vehicleOrGhost.routeId)
  )

const RightPanel = ({
  selectedVehicleOrGhost,
}: {
  selectedVehicleOrGhost?: VehicleOrGhost
}): ReactElement<HTMLElement> | null => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const { selectedNotification } = state
  const routes: Route[] | null = useContext(RoutesContext)
  const vehicleAndRouteForNotification = useContext(
    VehicleAndRouteForNotificationContext
  )

  // close notification if you move away from ladder page
  // TODO delete when notifications are viewable from anywhere
  const history = useHistory()
  if (history) {
    /* istanbul ignore next */
    history.listen(() => dispatch(setNotification(undefined)))
  }

  if (vehicleAndRouteForNotification && selectedVehicleOrGhost) {
    /* istanbul ignore next */
    Sentry.captureMessage(
      "vehicleAndRouteForNotification and selectedVehicleOrGhost both set, which should be impossible"
    )
  }

  if (selectedNotification && vehicleAndRouteForNotification) {
    return (
      <PropertiesPanel
        selectedVehicleOrGhost={vehicleAndRouteForNotification.vehicleOrGhost}
        route={vehicleAndRouteForNotification.route}
      />
    )
  } else if (
    state.selectedVehicleId &&
    selectedVehicleOrGhost?.id === state.selectedVehicleId
  ) {
    return (
      <PropertiesPanel
        selectedVehicleOrGhost={selectedVehicleOrGhost}
        route={vehicleRoute(routes, selectedVehicleOrGhost)}
      />
    )
  } else {
    return null
  }
}

export default RightPanel
