import { ResearchScenarioAction, ResearchScenarioState } from "./types"

export const initialResearchScenarioState: ResearchScenarioState<string> = {
  activeScenarioId: null,
  isBroadcasting: false,
  error: null,
}

/**
 * Reducer managing research scenario activation, reset, and broadcast lifecycle.
 */
export const researchScenarioReducer = <Id extends string = string>(
  state: ResearchScenarioState<Id> = initialResearchScenarioState as ResearchScenarioState<Id>,
  action: ResearchScenarioAction<Id>
): ResearchScenarioState<Id> => {
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
