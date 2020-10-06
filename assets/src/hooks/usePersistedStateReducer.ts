import { useEffect, useReducer } from "react"
import appData from "../appData"
import { loadState, saveState } from "../localStorage"
import {
  defaultSettings,
  putLadderVehicleLabel,
  putShuttleVehicleLabel,
  Settings,
  settingsFromData,
} from "../settings"
import { Dispatch, initialState, reducer, State } from "../state"

const APP_STATE_KEY = "mbta-skate-state"

type Key = string[]

const PERSISTED_KEYS: Key[] = [
  ["selectedRouteIds"],
  ["ladderDirections"],
  ["ladderCrowdingToggles"],
  ["selectedVehicleId"],
  ["selectedShuttleRouteIds"],
  ["selectedShuttleRunIds"],
  ["searchPageState", "savedQueries"],
]

const usePersistedStateReducer = (): [State, Dispatch] => {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  const persistableState = filter(state, PERSISTED_KEYS)
  useEffect(() => {
    saveState(APP_STATE_KEY, persistableState)
  }, [persistableState])

  return [state, dispatch]
}

const init = (): State => {
  const loadedState: object | undefined = loadState(APP_STATE_KEY)
  let settings: Settings
  if (loadedState !== undefined && loadedState.hasOwnProperty("settings")) {
    // migrating settings from localStorage to database
    const localStorageSettings: Settings = (loadedState as {
      settings: Settings
    }).settings
    putLadderVehicleLabel(localStorageSettings.ladderVehicleLabel)
    putShuttleVehicleLabel(localStorageSettings.shuttleVehicleLabel)
    // settings will be removed from localStorage when they're next saved
    // prefer these settings to the ones that came from the backend
    settings = localStorageSettings
  } else {
    const backendSettingsString: string | undefined = appData()?.settings
    if (backendSettingsString !== undefined) {
      settings = settingsFromData(JSON.parse(backendSettingsString))
    } else {
      settings = defaultSettings
    }
  }
  return merge<State>(
    { ...initialState, settings },
    loadedState || {},
    PERSISTED_KEYS
  )
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
