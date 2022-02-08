import { useEffect, useReducer, useState } from "react"
import { putRouteSettings, putRouteTabs } from "../api"
import appData from "../appData"
import { loadState, saveState } from "../localStorage"
import { defaultRouteSettings, RouteSettings } from "../routeSettings"
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
import { RouteTab, parseRouteTabData } from "../models/routeTab"

const APP_STATE_KEY = "mbta-skate-state"

type Key = string[]

const LOCALLY_PERSISTED_KEYS: Key[] = [
  ["selectedShuttleRouteIds"],
  ["selectedShuttleRunIds"],
  ["searchPageState", "savedQueries"],
]

const routeTabsPushRetries = 2

const usePersistedStateReducer = (): [State, Dispatch] => {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  const locallyPersistableState = filter(state, LOCALLY_PERSISTED_KEYS)

  useEffect(() => {
    saveState(APP_STATE_KEY, locallyPersistableState)
  }, [locallyPersistableState])

  const {
    selectedRouteIds,
    ladderDirections,
    ladderCrowdingToggles,
    routeTabsToPush,
    routeTabsPushInProgress,
  } = state

  const [firstLoadDone, setFirstLoadDone] = useState(false)
  const [routeTabsPushRetriesLeft, setRouteTabsPushRetriesLeft] =
    useState(routeTabsPushRetries)

  useEffect(() => {
    if (firstLoadDone) {
      putRouteSettings({
        selectedRouteIds: state.selectedRouteIds,
        ladderDirections: state.ladderDirections,
        ladderCrowdingToggles: state.ladderCrowdingToggles,
      })
    } else {
      setFirstLoadDone(true)
    }
  }, [selectedRouteIds, ladderDirections, ladderCrowdingToggles])

  useEffect(() => {
    if (routeTabsToPush[0] && !routeTabsPushInProgress) {
      dispatch(startingRouteTabsPush())
      putRouteTabs(routeTabsToPush[0])
        .then((response) => {
          if (response.ok) {
            setRouteTabsPushRetriesLeft(routeTabsPushRetries)
            dispatch(routeTabsPushComplete())
          } else if (routeTabsPushRetriesLeft > 0) {
            setRouteTabsPushRetriesLeft(routeTabsPushRetriesLeft - 1)
            dispatch(retryRouteTabsPushIfNotOutdated(routeTabsToPush[0]))
          } else {
            setRouteTabsPushRetriesLeft(routeTabsPushRetries)
            dispatch(routeTabsPushComplete())
          }
        })
        .catch(() => {
          if (routeTabsPushRetriesLeft > 0) {
            setRouteTabsPushRetriesLeft(routeTabsPushRetriesLeft - 1)
            dispatch(retryRouteTabsPushIfNotOutdated(routeTabsToPush[0]))
          } else {
            setRouteTabsPushRetriesLeft(routeTabsPushRetries)
            dispatch(routeTabsPushComplete())
          }
        })
    }
  }, [JSON.stringify(routeTabsToPush), routeTabsPushInProgress])

  return [state, dispatch]
}

const init = (): State => {
  const loadedState: object | undefined = loadState(APP_STATE_KEY)
  const userSettings = getUserSettings(loadedState)
  const routeSettings = getRouteSettings(loadedState)
  const routeTabs = getRouteTabs()
  const result = merge<State>(
    { ...initialState, ...routeSettings, routeTabs, userSettings },
    loadedState || {},
    LOCALLY_PERSISTED_KEYS
  )
  return result
}

const getUserSettings = (loadedState: object | undefined): UserSettings => {
  let userSettings: UserSettings
  if (loadedState !== undefined && loadedState.hasOwnProperty("settings")) {
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

const getRouteSettings = (loadedState: object | undefined): RouteSettings => {
  let routeSettings: RouteSettings
  if (
    loadedState !== undefined &&
    loadedState.hasOwnProperty("selectedRouteIds")
  ) {
    // migrating settings from localStorage to database
    const localStorageData = loadedState as RouteSettings
    routeSettings = {
      selectedRouteIds: localStorageData.selectedRouteIds,
      ladderDirections: localStorageData.ladderDirections,
      ladderCrowdingToggles: localStorageData.ladderCrowdingToggles,
    }
    putRouteSettings(routeSettings)
  } else {
    const backendSettingsString: string | undefined = appData()?.routeSettings
    if (backendSettingsString !== undefined) {
      const { selected_route_ids, ladder_directions, ladder_crowding_toggles } =
        JSON.parse(backendSettingsString)
      routeSettings = {
        selectedRouteIds: selected_route_ids,
        ladderDirections: ladder_directions,
        ladderCrowdingToggles: ladder_crowding_toggles,
      }
    } else {
      routeSettings = defaultRouteSettings
    }
  }

  return routeSettings
}

const getRouteTabs = (): RouteTab[] => {
  let routeTabs: RouteTab[] = []

  const backendSettingsString: string | undefined = appData()?.routeTabs
  if (backendSettingsString !== undefined) {
    routeTabs = parseRouteTabData(JSON.parse(backendSettingsString))
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
