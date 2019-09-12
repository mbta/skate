import { useEffect, useReducer } from "react"
import { loadState, saveState } from "../localStorage"
import { defaultSettings } from "../settings"
import { Dispatch, Reducer, State } from "../state"

const APP_STATE_KEY = "mbta-skate-state"

// NB: Be sure to include thes in the useEffect dependencies below as well
const PERSISTED_KEYS = ["selectedRouteIds", "selectedShuttleRunIds", "settings"]

const usePersistedStateReducer = (
  reducer: Reducer,
  defaultValue: State
): [State, Dispatch] => {
  let loadedState = loadState(APP_STATE_KEY) as State | undefined

  // Update to new settings properties from saved values in local storage.
  // This can be removed after it's live for awhile, along with property in Settings -- MSS 2019-09-11
  if (
    loadedState &&
    Object.keys(loadedState).includes("settings") &&
    Object.keys(loadedState.settings).length === 1 &&
    Object.keys(loadedState.settings)[0] === "vehicleLabel"
  ) {
    loadedState = {
      ...loadedState,
      settings: {
        vehicleLabel: undefined,
        ladderVehicleLabel:
          loadedState.settings.vehicleLabel ||
          defaultSettings.ladderVehicleLabel,
        shuttleVehicleLabel: defaultSettings.shuttleVehicleLabel,
      },
    }

    // Save these changes right away
    saveState(APP_STATE_KEY, filter(loadedState, PERSISTED_KEYS))
  }

  const [state, dispatch] = useReducer(
    reducer,
    defaultValue,
    (initial: State) => ({ ...initial, ...loadedState })
  )

  useEffect(() => {
    const persistableState = filter(state, PERSISTED_KEYS)
    saveState(APP_STATE_KEY, persistableState)
  }, [state.selectedRouteIds, state.selectedShuttleRunIds, state.settings])

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
