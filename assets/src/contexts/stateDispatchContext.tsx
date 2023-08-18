import React, { createContext, ReactElement } from "react"
import { Dispatch, initialState, State } from "../state"

export type StateDispatchContextData = [State, Dispatch]

const noopDispatch: Dispatch = () => {}
export const StateDispatchContext = createContext([
  initialState,
  noopDispatch,
] as StateDispatchContextData)

export const StateDispatchProvider = ({
  state,
  dispatch,
  children,
}: {
  state: State
  dispatch: Dispatch
  children: ReactElement<HTMLElement>
}) => {
  return (
    <StateDispatchContext.Provider value={[state, dispatch]}>
      {children}
    </StateDispatchContext.Provider>
  )
}
