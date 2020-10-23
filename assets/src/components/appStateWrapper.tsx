import React from "react"
import { NotificationsProvider } from "../contexts/notificationsContext"
import { RoutesProvider } from "../contexts/routesContext"
import { SocketProvider } from "../contexts/socketContext"
import { StateDispatchProvider } from "../contexts/stateDispatchContext"
import { VehicleForNotificationProvider } from "../contexts/vehicleForNotificationContext"
import usePersistedStateReducer from "../hooks/usePersistedStateReducer"
import useRoutes from "../hooks/useRoutes"
import useSocket from "../hooks/useSocket"
import useVehicleForNotification from "../hooks/useVehicleForNotification"
import App from "./app"

const AppStateWrapper = (): JSX.Element => {
  const [state, dispatch] = usePersistedStateReducer()
  const socketStatus = useSocket()
  const routes = useRoutes()

  const vehicleForNotification = useVehicleForNotification(
    state.selectedNotification,
    socketStatus.socket
  )

  return (
    <StateDispatchProvider state={state} dispatch={dispatch}>
      <SocketProvider socketStatus={socketStatus}>
        <RoutesProvider routes={routes}>
          <NotificationsProvider>
            <VehicleForNotificationProvider
              vehicleForNotification={vehicleForNotification}
            >
              <App />
            </VehicleForNotificationProvider>
          </NotificationsProvider>
        </RoutesProvider>
      </SocketProvider>
    </StateDispatchProvider>
  )
}

export default AppStateWrapper
