import { useEffect, useReducer } from "react"
import { loadState, saveState } from "../localStorage"
import { Dispatch, Reducer, State } from "../state"

const APP_STATE_KEY = "mbta-skate-state"

type Key = string[]

const PERSISTED_KEYS: Key[] = [
  ["selectedRouteIds"],
  ["selectedShuttleRouteIds"],
  ["selectedShuttleRunIds"],
  ["settings"],
  ["searchPageState", "savedQueries"],
]

const usePersistedStateReducer = (
  reducer: Reducer,
  defaultValue: State
): [State, Dispatch] => {
  const loadedState = loadState(APP_STATE_KEY) as State | undefined
  const [state, dispatch] = useReducer(
    reducer,
    defaultValue,
    (initial: State) => merge<State>(initial, loadedState || {}, PERSISTED_KEYS)
  )
  const persistableState = filter(state, PERSISTED_KEYS)

  useEffect(() => {
    saveState(APP_STATE_KEY, persistableState)
  }, [persistableState])

  return [state, dispatch]
}

export const get = (obj: object, key: Key): any | undefined =>
  key.reduce(
    (acc: object | undefined, field: string) =>
      typeof acc === "object" ? (acc as any)[field] : undefined,
    obj
  )

export const insert = (base: object, key: Key, value: any): object => {
  if (key.length === 0) {
    return value
  } else {
    const field = key[0]
    return {
      ...base,
      [field]: insert(
        base.hasOwnProperty(field) ? (base as any)[field] : {},
        key.slice(1),
        value
      ),
    }
  }
}

export const filter = (obj: object, allowedKeys: Key[]): object =>
  allowedKeys.reduce((acc, key) => insert(acc, key, get(obj, key)), {})

export const merge = <O extends object>(base: O, top: object, keys: Key[]): O =>
  keys.reduce((acc: O, key: Key): O => {
    const value: any | undefined = get(top, key)
    return value === undefined ? acc : (insert(acc, key, value) as O)
  }, base)

export default usePersistedStateReducer
