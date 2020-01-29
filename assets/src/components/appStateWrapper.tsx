import React from "react"
import { SocketProvider } from "../contexts/socketContext"
import { StateDispatchProvider } from "../contexts/stateDispatchContext"
import usePersistedStateReducer from "../hooks/usePersistedStateReducer"
import useSocket from "../hooks/useSocket"
import { initialState, reducer } from "../state"
import App from "./app"

const AppStateWrapper = (): JSX.Element => {
  const [state, dispatch] = usePersistedStateReducer(reducer, initialState)

  const { socket } = useSocket()

  return (
    <StateDispatchProvider state={state} dispatch={dispatch}>
      <SocketProvider socket={socket}>
        <App />
      </SocketProvider>
    </StateDispatchProvider>
  )
}

export default AppStateWrapper
