import React, { useReducer } from "react"
import useRoutes from "../hooks/useRoutes"
import useSocket from "../hooks/useSocket"
import useTimepoints from "../hooks/useTimepoints"
import useVehicles from "../hooks/useVehicles"
import DispatchProvider from "../providers/dispatchProvider"
import { Route, TimepointsByRouteId } from "../skate.d"
import { initialState, reducer } from "../state"
import RouteLadders from "./routeLadders"
import RoutePicker from "./routePicker"

const App = (): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { selectedRouteIds } = state

  const routes: Route[] | null = useRoutes()
  const timepointsByRouteId: TimepointsByRouteId = useTimepoints(
    selectedRouteIds
  )
  const socket = useSocket()
  const vehiclesByRouteId = useVehicles(socket, selectedRouteIds)

  const selectedRoutes = (routes || []).filter(route =>
    selectedRouteIds.includes(route.id)
  )

  return (
    <DispatchProvider dispatch={dispatch}>
      <div className="m-app">
        <RoutePicker routes={routes} selectedRouteIds={selectedRouteIds} />

        <RouteLadders
          routes={selectedRoutes}
          timepointsByRouteId={timepointsByRouteId}
          vehiclesByRouteId={vehiclesByRouteId}
        />
      </div>
    </DispatchProvider>
  )
}

export default App
