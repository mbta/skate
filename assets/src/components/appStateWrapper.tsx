import React, { PropsWithChildren } from "react"
import { NotificationsProvider } from "../contexts/notificationsContext"
import { RoutesProvider } from "../contexts/routesContext"
import { SocketProvider } from "../contexts/socketContext"
import { StateDispatchProvider } from "../contexts/stateDispatchContext"
import usePersistedStateReducer from "../hooks/usePersistedStateReducer"
import useRoutes from "../hooks/useRoutes"
import useSocket from "../hooks/useSocket"

export const AppStateProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = usePersistedStateReducer()
  const socketStatus = useSocket()
  const routes = useRoutes()

  return (
    <StateDispatchProvider state={state} dispatch={dispatch}>
      <SocketProvider socketStatus={socketStatus}>
        <RoutesProvider routes={routes}>
          <NotificationsProvider>{children}</NotificationsProvider>
        </RoutesProvider>
      </SocketProvider>
    </StateDispatchProvider>
  )
}
const AppStateWrapper = ({ children }: PropsWithChildren): JSX.Element => (
  <AppStateProvider>{children}</AppStateProvider>
)

export default AppStateWrapper
