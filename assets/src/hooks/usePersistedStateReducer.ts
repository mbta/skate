import { useEffect, useReducer, useRef } from "react"
import { putRouteTabs } from "../api"
import appData from "../appData"
import { loadState, saveState } from "../localStorage"
import {
  Dispatch,
  initialState,
  reducer,
  State,
  startingRouteTabsPush,
  routeTabsPushComplete,
  retryRouteTabsPushIfNotOutdated,
} from "../state"
import {
  defaultUserSettings,
  putLadderVehicleLabel,
  putShuttleVehicleLabel,
  putVehicleAdherenceColors,
  UserSettings,
  userSettingsFromData,
} from "../userSettings"
import { RouteTab, parseRouteTabData, RouteTabData } from "../models/routeTab"
import { array, assert } from "superstruct"

const APP_STATE_KEY = "mbta-skate-state"

type Key = string[]

const LOCALLY_PERSISTED_KEYS: Key[] = [
  ["openView"],
  ["pickerContainerIsVisible"],
  ["selectedShuttleRouteIds"],
  ["selectedShuttleRunIds"],
  ["searchPageState", "savedQueries"],
  ["showGaragesFilter"],
]

const routeTabsPushRetries = 2

const usePersistedStateReducer = (): [State, Dispatch] => {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  const locallyPersistableState = filter(state, LOCALLY_PERSISTED_KEYS)

  useEffect(() => {
    saveState(APP_STATE_KEY, locallyPersistableState)
  }, [locallyPersistableState])

  const { routeTabsToPush, routeTabsPushInProgress } = state

  const routeTabsPushRetriesLeft = useRef(routeTabsPushRetries)

  useEffect(() => {
    if (routeTabsToPush && !routeTabsPushInProgress) {
      const currentTriesLeft = routeTabsPushRetriesLeft.current
      dispatch(startingRouteTabsPush())
      putRouteTabs(routeTabsToPush)
        .then((response) => {
          if (response.ok) {
            routeTabsPushRetriesLeft.current = routeTabsPushRetries
            dispatch(routeTabsPushComplete())
          } else if (currentTriesLeft > 0) {
            routeTabsPushRetriesLeft.current = currentTriesLeft - 1
            dispatch(retryRouteTabsPushIfNotOutdated(routeTabsToPush))
          } else {
            routeTabsPushRetriesLeft.current = routeTabsPushRetries
            dispatch(routeTabsPushComplete())
          }
        })
        .catch(() => {
          if (currentTriesLeft > 0) {
            routeTabsPushRetriesLeft.current = currentTriesLeft - 1
            dispatch(retryRouteTabsPushIfNotOutdated(routeTabsToPush))
          } else {
            routeTabsPushRetriesLeft.current = routeTabsPushRetries
            dispatch(routeTabsPushComplete())
          }
        })
    }
  }, [routeTabsToPush, routeTabsPushInProgress])
  /* eslint-enable react-hooks/exhaustive-deps */

  return [state, dispatch]
}

const init = (): State => {
  const loadedState: object | undefined = loadState(APP_STATE_KEY)
  const userSettings = getUserSettings(loadedState)
  const routeTabs = getRouteTabs()
  const result = merge<State>(
    { ...initialState, routeTabs, userSettings },
    loadedState || {},
    LOCALLY_PERSISTED_KEYS
  )
  return result
}

const getUserSettings = (loadedState: object | undefined): UserSettings => {
  let userSettings: UserSettings
  if (
    loadedState !== undefined &&
    Object.prototype.hasOwnProperty.call(loadedState, "settings")
  ) {
    // migrating settings from localStorage to database
    const localStorageSettings: UserSettings = (
      loadedState as {
        settings: UserSettings
      }
    ).settings
    putLadderVehicleLabel(localStorageSettings.ladderVehicleLabel)
    putShuttleVehicleLabel(localStorageSettings.shuttleVehicleLabel)
    putVehicleAdherenceColors(localStorageSettings.vehicleAdherenceColors)
    // settings will be removed from localStorage when they're next saved
    // prefer these settings to the ones that came from the backend
    userSettings = localStorageSettings
  } else {
    const backendSettingsString: string | undefined = appData()?.userSettings
    if (backendSettingsString !== undefined) {
      userSettings = userSettingsFromData(JSON.parse(backendSettingsString))
    } else {
      userSettings = defaultUserSettings
    }
  }

  return userSettings
}

const getRouteTabs = (): RouteTab[] => {
  let routeTabs: RouteTab[] = []

  const backendSettingsString: string | undefined = appData()?.routeTabs
  if (backendSettingsString !== undefined) {
    const backendSettings = JSON.parse(backendSettingsString) as unknown

    assert(backendSettings, array(RouteTabData))

    routeTabs = parseRouteTabData(backendSettings)
  }

  return routeTabs
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
        Object.prototype.hasOwnProperty.call(base, field)
          ? (base as any)[field]
          : {},
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
