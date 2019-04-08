import React, { useEffect, useReducer } from "react"
import * as Api from "../api"
import { Route } from "../skate.d"
import RoutePicker from "./route_picker"

interface State {
  routes: null | Route[]
}

const initialState: State = {
  routes: null,
}

interface SetRoutesAction {
  type: "SET_ROUTES"
  payload: {
    routes: Route[]
  }
}

type Action = SetRoutesAction

const setRoutes = (routes: Route[]): SetRoutesAction => ({
  type: "SET_ROUTES",
  payload: { routes },
})

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ROUTES":
      return {
        ...state,
        routes: action.payload.routes,
      }
    default:
      return state
  }
}

const App = (): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    Api.fetchRoutes()
      .then((routes: Route[]) =>
        dispatch(setRoutes(routes))
      )
  }, [])

  return (
    <>
      <h1>Skate</h1>

      <RoutePicker routes={state.routes} />
    </>
  )
}

export default App
