import React, { useReducer } from "react"
import useRoutes from "../hooks/useRoutes"
import useSocket from "../hooks/useSocket"
import useTimepoints from "../hooks/useTimepoints"
import useVehicles from "../hooks/useVehicles"
import DispatchProvider from "../providers/dispatchProvider"
import { Route, TimepointsByRouteId } from "../skate"
import { initialState, reducer } from "../state"
import App from "./app"

const AppStateWrapper = (): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { selectedRouteIds, selectedVehicleId } = state

  const routes: Route[] | null = useRoutes()
  const timepointsByRouteId: TimepointsByRouteId = useTimepoints(
    selectedRouteIds
  )
  const socket = useSocket()
  const vehiclesByRouteId = useVehicles(socket, selectedRouteIds)

  return (
    <DispatchProvider dispatch={dispatch}>
      <App
        routes={routes}
        timepointsByRouteId={timepointsByRouteId}
        selectedRouteIds={selectedRouteIds}
        vehiclesByRouteId={vehiclesByRouteId}
        selectedVehicleId={selectedVehicleId}
      />
    </DispatchProvider>
  )
}

export default AppStateWrapper
