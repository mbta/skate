import React, { ReactElement } from "react"

import StateDispatchContext from "../contexts/stateDispatchContext"
import { Dispatch, State } from "../state"

const StateDispatchProvider = ({
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

export default StateDispatchProvider
