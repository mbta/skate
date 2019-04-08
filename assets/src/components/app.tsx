import React, { useReducer } from "react"
import { Route } from "../skate.d"
import RoutePicker from "./route_picker"

interface State {
  routes: null | Route[],
}

const initialState: State = {
  routes: null,
}

function reducer(state: State, _action: Function) {
  return state
}


const App = (): JSX.Element => {
  const [state, _dispatch] = useReducer(reducer, initialState)

  return (
    <>
      <h1>Skate</h1>

      <RoutePicker routes={state.routes} />
    </>
  )
}

export default App
