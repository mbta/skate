import { createContext } from "react"
import { Dispatch, initialState, State } from "../state"

type StateDispatchContextData = [State, Dispatch]

// tslint:disable-next-line: no-empty
const noopDispatch: Dispatch = () => {}
const StateDispatchContext = createContext([
  initialState,
  noopDispatch,
] as StateDispatchContextData)

export default StateDispatchContext
