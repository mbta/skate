import { ScenarioAction, ScenarioState } from "./types"

export const initialScenarioState: ScenarioState<string> = {
  activeScenarioId: null,
  isBroadcasting: false,
  error: null,
}

/**
 * Reducer managing scenario activation, reset, and broadcast lifecycle.
 */
export const scenarioReducer = <Id extends string = string>(
  state: ScenarioState<Id> = initialScenarioState as ScenarioState<Id>,
  action: ScenarioAction<Id>
): ScenarioState<Id> => {
  switch (action.type) {
    case "TRIGGER_START":
      return {
        ...state,
        isBroadcasting: true,
        error: null,
      }

    case "TRIGGER_SUCCESS":
      return {
        ...state,
        activeScenarioId: action.scenarioId,
        isBroadcasting: false,
        error: null,
      }

    case "RESET_START":
      return {
        ...state,
        isBroadcasting: true,
        error: null,
      }

    case "RESET_SUCCESS":
      return {
        ...state,
        activeScenarioId: null,
        isBroadcasting: false,
        error: null,
      }

    case "SET_ERROR":
      return {
        ...state,
        isBroadcasting: false,
        error: action.error,
      }

    default:
      return state
  }
}
