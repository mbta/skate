import React, { useEffect, useReducer } from "react"
import { Route } from "../skate.d"
import RoutePicker from "./route_picker"

interface RoutesRequestResponse {
  data: Route[]
}

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
    fetch("/api/routes")
      .then((response: Response) => {
        if (response.status !== 200) {
          throw new Error(`Response error: ${response.status}`)
        }
        return response
      })
      .then((response: Response) => response.json())
      .then(({ data: routes }: RoutesRequestResponse) =>
        dispatch(setRoutes(routes)),
      )
      .catch(error => {
        console.log(`Error loading routes`, error)
      })
  }, [])

  return (
    <>
      <h1>Skate</h1>

      <RoutePicker routes={state.routes} />
    </>
  )
}

export default App
