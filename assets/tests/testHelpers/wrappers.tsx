import { useReducer } from "react"
import React from "react"
import { BrowserRouter } from "react-router"
import { reducer, State } from "../../src/state"
import stateFactory from "../factories/applicationState"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"

export const Router = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

export const RealDispatchWrapper = ({
  children,
  initialState,
}: {
  children: React.ReactElement
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
