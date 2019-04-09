import React, { useEffect, useReducer } from "react"
import * as Api from "../api"
import { Route } from "../skate.d"
import { initialState, reducer, setRoutes } from "../state"
import RoutePicker from "./routePicker"

const App = (): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    Api.fetchRoutes().then((routes: Route[]) => dispatch(setRoutes(routes)))
  }, [])

  return (
    <>
      <h1>Skate</h1>

      <RoutePicker
        routes={state.routes}
        selectedRouteIds={state.selectedRouteIds}
        dispatch={dispatch}
      />
    </>
  )
}

export default App
