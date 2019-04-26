import React, { useReducer } from "react"
import { useFetchRoutes } from "../hooks/useFetchRoutes"
import { useFetchTimepoints } from "../hooks/useFetchTimepoints"
import DispatchProvider from "../providers/dispatchProvider"
import { initialState, reducer } from "../state"
import RouteLadders from "./routeLadders"
import RoutePicker from "./routePicker"

const App = (): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { routes, selectedRouteIds, timepointsByRouteId } = state

  useFetchRoutes(dispatch)
  useFetchTimepoints(selectedRouteIds, timepointsByRouteId, dispatch)

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
        />
      </div>
    </DispatchProvider>
  )
}

export default App
