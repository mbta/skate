import { useReducer } from "react"
import React from "react"
import { reducer, State } from "../../src/state"
import stateFactory from "../factories/applicationState"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"

export const RealDispatchWrapper = ({
  children,
  initialState,
}: {
  children: JSX.Element
  initialState?: State
}) => {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => initialState || stateFactory.build()
  )
  return (
    <StateDispatchProvider state={state} dispatch={dispatch}>
      {children}
    </StateDispatchProvider>
  )
}
