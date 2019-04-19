import { createContext } from "react"
import { Dispatch } from "../state"

// tslint:disable-next-line: no-empty
const noopDispatch: Dispatch = () => {}
const DispatchContext = createContext(noopDispatch)

export default DispatchContext
