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

  const persistableState = filter(state, PERSISTED_KEYS)
  useEffect(() => {
    saveState(APP_STATE_KEY, persistableState)
  }, [persistableState])

  return [state, dispatch]
}

export const filter = (obj: object, allowedKeys: string[]): object =>
  keys(obj)
    .filter(key => allowedKeys.includes(key))
    .reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {})

function keys<O extends object>(obj: O): Array<keyof O> {
  return Object.keys(obj) as Array<keyof O>
}

export default usePersistedStateReducer
