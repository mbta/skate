import React from "react"
import { NotificationsProvider } from "../contexts/notificationsContext"
import { RoutesProvider } from "../contexts/routesContext"
import { SocketProvider } from "../contexts/socketContext"
import { StateDispatchProvider } from "../contexts/stateDispatchContext"
import usePersistedStateReducer from "../hooks/usePersistedStateReducer"
import useRoutes from "../hooks/useRoutes"
import useSocket from "../hooks/useSocket"
import App from "./app"

const AppStateWrapper = (): JSX.Element => {
  const [state, dispatch] = usePersistedStateReducer()
  const socketStatus = useSocket()
  const routes = useRoutes()

  return (
    <StateDispatchProvider state={state} dispatch={dispatch}>
      <SocketProvider socketStatus={socketStatus}>
        <RoutesProvider routes={routes}>
          <NotificationsProvider>
            <App />
          </NotificationsProvider>
        </RoutesProvider>
      </SocketProvider>
    </StateDispatchProvider>
  )
}

export default AppStateWrapper
