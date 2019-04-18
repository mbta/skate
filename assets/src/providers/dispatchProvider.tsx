import React, { ReactElement } from "react"

import DispatchContext from "../contexts/dispatchContext"
import { Dispatch } from "../state"

const DispatchProvider = ({
  dispatch,
  children,
}: {
  dispatch: Dispatch
  children: ReactElement<HTMLElement>
}) => {
  return (
    <DispatchContext.Provider value={dispatch}>
      {children}
    </DispatchContext.Provider>
  )
}

export default DispatchProvider
