import React from "react"
import { NotificationsProvider } from "../contexts/notificationsContext"
import { SocketProvider } from "../contexts/socketContext"
import { StateDispatchProvider } from "../contexts/stateDispatchContext"
import usePersistedStateReducer from "../hooks/usePersistedStateReducer"
import useSocket from "../hooks/useSocket"
import { initialState, reducer } from "../state"
import App from "./app"

const AppStateWrapper = (): JSX.Element => {
  const [state, dispatch] = usePersistedStateReducer(reducer, initialState)
  const socketStatus = useSocket()

  return (
    <StateDispatchProvider state={state} dispatch={dispatch}>
      <SocketProvider socketStatus={socketStatus}>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </SocketProvider>
    </StateDispatchProvider>
  )
}

export default AppStateWrapper
