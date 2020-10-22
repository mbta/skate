import React from "react"
import { NotificationsProvider } from "../contexts/notificationsContext"
import RoutesContext from "../contexts/routesContext"
import { SocketProvider } from "../contexts/socketContext"
import { StateDispatchProvider } from "../contexts/stateDispatchContext"
import VehicleAndRouteForNotificationContext from "../contexts/vehicleAndRouteForNotificationContext"
import usePersistedStateReducer from "../hooks/usePersistedStateReducer"
import useRoutes from "../hooks/useRoutes"
import useSocket from "../hooks/useSocket"
import useVehicleAndRouteForNotification from "../hooks/useVehicleAndRouteForNotification"
import App from "./app"

const AppStateWrapper = (): JSX.Element => {
  const [state, dispatch] = usePersistedStateReducer()
  const socketStatus = useSocket()
  const routes = useRoutes()

  const vehicleAndRouteForNotification = useVehicleAndRouteForNotification(
    state.selectedNotification
  )

  return (
    <StateDispatchProvider state={state} dispatch={dispatch}>
      <SocketProvider socketStatus={socketStatus}>
        <RoutesContext.Provider value={routes}>
          <NotificationsProvider>
            <VehicleAndRouteForNotificationContext.Provider
              value={vehicleAndRouteForNotification}
            >
              <App />
            </VehicleAndRouteForNotificationContext.Provider>
          </NotificationsProvider>
        </RoutesContext.Provider>
      </SocketProvider>
    </StateDispatchProvider>
  )
}

export default AppStateWrapper
