import React, { useEffect, useReducer } from "react"
import * as Api from "../api"
import { Route } from "../skate.d"
import {
  initialState,
  reducer,
  setRoutes,
  timepointsForRouteId,
} from "../state"
import RouteLadders from "./routeLadders"
import RoutePicker from "./routePicker"

const App = (): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { routes, selectedRouteIds } = state

  useEffect(() => {
    Api.fetchRoutes().then((newRoutes: Route[]) =>
      dispatch(setRoutes(newRoutes))
    )
  }, [])

  const selectedRoutes = (routes || []).filter(route =>
    selectedRouteIds.includes(route.id)
  )

  return (
    <div className="m-app">
      <RoutePicker
        routes={routes}
        selectedRouteIds={selectedRouteIds}
        dispatch={dispatch}
      />

      <RouteLadders
        routes={selectedRoutes}
        dispatch={dispatch}
        timepointsForRouteId={timepointsForRouteId(state)}
      />
    </div>
  )
}

export default App
