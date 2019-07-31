import React from "react"
import usePersistedStateReducer from "../hooks/usePersistedStateReducer"
import useRoutes from "../hooks/useRoutes"
import useSocket from "../hooks/useSocket"
import useTimepoints from "../hooks/useTimepoints"
import useVehicles from "../hooks/useVehicles"
import DispatchProvider from "../providers/dispatchProvider"
import VehiclesByRouteIdProvider from "../providers/vehiclesByRouteIdProvider"
import { Route, TimepointsByRouteId } from "../schedule.d"
import { initialState, reducer } from "../state"
import App from "./app"

const AppStateWrapper = (): JSX.Element => {
  const [state, dispatch] = usePersistedStateReducer(reducer, initialState)
  const { routePickerIsVisible, selectedRouteIds, selectedVehicleId } = state

  const routes: Route[] | null = useRoutes()
  const timepointsByRouteId: TimepointsByRouteId = useTimepoints(
    selectedRouteIds
  )
  const socket = useSocket()
  const vehiclesByRouteId = useVehicles(socket, selectedRouteIds)

  return (
    <DispatchProvider dispatch={dispatch}>
      <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
        <App
          routePickerIsVisible={routePickerIsVisible}
          routes={routes}
          timepointsByRouteId={timepointsByRouteId}
          selectedRouteIds={selectedRouteIds}
          selectedVehicleId={selectedVehicleId}
        />
      </VehiclesByRouteIdProvider>
    </DispatchProvider>
  )
}

export default AppStateWrapper
