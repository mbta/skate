import React from "react"
import usePersistedStateReducer from "../hooks/usePersistedStateReducer"
import useSocket from "../hooks/useSocket"
import useVehicles from "../hooks/useVehicles"
import StateDispatchProvider from "../providers/stateDispatchProvider"
import VehiclesByRouteIdProvider from "../providers/vehiclesByRouteIdProvider"
import { initialState, reducer } from "../state"
import App from "./app"

const AppStateWrapper = (): JSX.Element => {
  const [state, dispatch] = usePersistedStateReducer(reducer, initialState)
  const { selectedRouteIds } = state

  const socket = useSocket()
  const vehiclesByRouteId = useVehicles(socket, selectedRouteIds)

  return (
    <StateDispatchProvider state={state} dispatch={dispatch}>
      <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
        <App />
      </VehiclesByRouteIdProvider>
    </StateDispatchProvider>
  )
}

export default AppStateWrapper
