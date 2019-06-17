import React, { useReducer } from "react"
import useRoutes from "../hooks/useRoutes"
import useSocket from "../hooks/useSocket"
import useTimepoints from "../hooks/useTimepoints"
import useVehicles from "../hooks/useVehicles"
import DispatchProvider from "../providers/dispatchProvider"
import { Route, TimepointsByRouteId, UserToken } from "../skate"
import { initialState, reducer } from "../state"
import App from "./app"

const readUserToken = (): UserToken | undefined => {
  const dataEl = document.getElementById("app-user-token")
  if (!dataEl) {
    return undefined
  }

  const token = dataEl.innerHTML as UserToken
  return token
}
const userToken: UserToken | undefined = readUserToken()

const AppStateWrapper = (): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { selectedRouteIds, selectedVehicleId } = state

  const routes: Route[] | null = useRoutes(userToken)
  const timepointsByRouteId: TimepointsByRouteId = useTimepoints(
    selectedRouteIds,
    userToken
  )
  const socket = useSocket(userToken)
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
