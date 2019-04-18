import React, { useEffect, useReducer } from "react"
import * as Api from "../api"
import DispatchProvider from "../providers/dispatchProvider"
import { Route } from "../skate.d"
import { initialState, reducer, setRoutes } from "../state"
import RouteLadders from "./routeLadders"
import RoutePicker from "./routePicker"

const App = (): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { routes, selectedRouteIds, timepointsByRouteId } = state

  useEffect(() => {
    Api.fetchRoutes().then((newRoutes: Route[]) =>
      dispatch(setRoutes(newRoutes))
    )
  }, [])

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
