import React, { useState } from "react"
import { InactiveNotificationProvider } from "../contexts/inactiveNotificationContext"
import { NotificationsProvider } from "../contexts/notificationsContext"
import { SocketProvider } from "../contexts/socketContext"
import { StateDispatchProvider } from "../contexts/stateDispatchContext"
import usePersistedStateReducer from "../hooks/usePersistedStateReducer"
import useSocket from "../hooks/useSocket"
import { Notification } from "../realtime"
import { initialState, reducer } from "../state"
import App from "./app"

const AppStateWrapper = (): JSX.Element => {
  const [state, dispatch] = usePersistedStateReducer(reducer, initialState)
  const socketStatus = useSocket()
  const [
    inactiveNotification,
    setInactiveNotification,
  ] = useState<Notification | null>(null)

  return (
    <StateDispatchProvider state={state} dispatch={dispatch}>
      <SocketProvider socketStatus={socketStatus}>
        <InactiveNotificationProvider
          notification={inactiveNotification}
          setInactiveNotification={setInactiveNotification}
        >
          <NotificationsProvider>
            <App />
          </NotificationsProvider>
        </InactiveNotificationProvider>
      </SocketProvider>
    </StateDispatchProvider>
  )
}

export default AppStateWrapper
