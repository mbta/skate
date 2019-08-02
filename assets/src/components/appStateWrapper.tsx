import React from "react"
import usePersistedStateReducer from "../hooks/usePersistedStateReducer"
import useSocket from "../hooks/useSocket"
import useTrips from "../hooks/useTrips"
import useVehicles from "../hooks/useVehicles"
import StateDispatchProvider from "../providers/stateDispatchProvider"
import TripsByIdProvider from "../providers/tripsByIdProvider"
import VehiclesByRouteIdProvider from "../providers/vehiclesByRouteIdProvider"
import { TripsById } from "../schedule.d"
import { initialState, reducer } from "../state"
import App from "./app"

const AppStateWrapper = (): JSX.Element => {
  const [state, dispatch] = usePersistedStateReducer(reducer, initialState)
  const { selectedRouteIds } = state

  const tripsById: TripsById = useTrips(selectedRouteIds)
  const socket = useSocket()
  const vehiclesByRouteId = useVehicles(socket, selectedRouteIds)

  return (
    <StateDispatchProvider state={state} dispatch={dispatch}>
      <TripsByIdProvider tripsById={tripsById}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
          <App />
        </VehiclesByRouteIdProvider>
      </TripsByIdProvider>
    </StateDispatchProvider>
  )
}

export default AppStateWrapper
