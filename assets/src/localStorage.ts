import { RouteId } from "./skate"

const APP_STATE_KEY = "mbta-skate-state"

const SAVED_KEYS = ["selectedRouteIds"]

interface PersistedState {
  selectedRouteIds: RouteId[]
}

export const saveState = (state: PersistedState) => {
  const perstableState = filter(state, SAVED_KEYS)
  const serializedState = JSON.stringify(perstableState)
  localStorage.setItem(APP_STATE_KEY, serializedState)
}

export const loadState = (): PersistedState | undefined => {
  const serializedState = localStorage.getItem(APP_STATE_KEY)

  if (serializedState === null) {
    return undefined
  }

  return JSON.parse(serializedState)
}

export const filter = (obj: object, allowedKeys: string[]): object =>
  keys(obj)
    .filter(key => allowedKeys.includes(key))
    .reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {})

function keys<O extends object>(obj: O): Array<keyof O> {
  return Object.keys(obj) as Array<keyof O>
}
