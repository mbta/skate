import { useEffect, useReducer } from "react"
import { loadState, saveState } from "../localStorage"
import { Dispatch, Reducer, State } from "../state"

const usePersistedStateReducer = (
  reducer: Reducer,
  defaultValue: State
): [State, Dispatch] => {
  const [state, dispatch] = useReducer(
    reducer,
    defaultValue,
    (initial: State) => ({ ...initial, ...loadState() })
  )

  useEffect(() => {
    saveState(state)
  }, [state])

  return [state, dispatch]
}

export default usePersistedStateReducer
