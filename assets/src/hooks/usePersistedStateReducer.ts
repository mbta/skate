import { useEffect, useReducer } from "react"
import { loadState, saveState } from "../localStorage"
import { Dispatch, Reducer, State } from "../state"

const APP_STATE_KEY = "mbta-skate-state"

const PERSISTED_KEYS = ["selectedRouteIds"]

const usePersistedStateReducer = (
  reducer: Reducer,
  defaultValue: State
): [State, Dispatch] => {
  const [state, dispatch] = useReducer(
    reducer,
    defaultValue,
    (initial: State) => ({ ...initial, ...loadState(APP_STATE_KEY) })
  )

  useEffect(() => {
    saveState(APP_STATE_KEY, state, PERSISTED_KEYS)
  }, [state])

  return [state, dispatch]
}

export default usePersistedStateReducer
