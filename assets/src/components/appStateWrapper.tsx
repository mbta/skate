import React from "react"
import { StateDispatchProvider } from "../contexts/stateDispatchContext"
import { VehiclesByRouteIdProvider } from "../contexts/vehiclesByRouteIdContext"
import usePersistedStateReducer from "../hooks/usePersistedStateReducer"
import useSchedules from "../hooks/useSchedules"
import useSocket from "../hooks/useSocket"
import useVehicles from "../hooks/useVehicles"
import { TripsById } from "../schedule.d"
import { initialState, reducer } from "../state"
import App from "./app"

const AppStateWrapper = (): JSX.Element => {
  const [state, dispatch] = usePersistedStateReducer(reducer, initialState)
  const { selectedRouteIds } = state

  const tripsById: TripsById = useSchedules(selectedRouteIds)
  console.log(Object.keys(tripsById))
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
