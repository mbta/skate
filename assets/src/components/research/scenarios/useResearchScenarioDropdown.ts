import { useCallback, useReducer } from "react"
import { Socket } from "phoenix"
import {
  initialResearchScenarioState,
  researchScenarioReducer,
} from "./researchScenarioReducer"
import { ResearchScenario, ResearchScenarioState } from "./types"
import { useResearchScenarioChannel } from "./useResearchScenarioChannel"

export interface UseResearchScenarioDropdownOptions<
  T = unknown,
  Id extends string = string,
> {
  scenarios?: readonly ResearchScenario<T, Id>[]
  socket?: Socket
  topic?: string
  onTriggerScenario?: (scenario: ResearchScenario<T, Id>) => void
  onResetScenario?: () => void
}

export interface UseResearchScenarioDropdownResult<Id extends string = string> {
  state: ResearchScenarioState<Id>
  selectScenario: (scenarioId: Id) => Promise<void>
  resetScenario: () => Promise<void>
}

/**
 * Custom hook orchestrating scenario selection,
 * Phoenix channel broadcasting, and state transitions for research scenario dropdowns.
 */
export const useResearchScenarioDropdown = <
  T = unknown,
  Id extends string = string,
>(
  options: UseResearchScenarioDropdownOptions<T, Id> = {}
): UseResearchScenarioDropdownResult<Id> => {
  const {
    scenarios = [],
    socket,
    topic,
    onTriggerScenario,
    onResetScenario,
  } = options

  const [state, dispatch] = useReducer(
    researchScenarioReducer<Id>,
    initialResearchScenarioState as ResearchScenarioState<Id>
  )

  const channel = useResearchScenarioChannel<T, Id>({
    socket,
    topic,
    onScenarioTriggered: onTriggerScenario,
    onScenarioReset: onResetScenario,
  })

  const selectScenario = useCallback(
    async (scenarioId: Id) => {
      dispatch({ type: "TRIGGER_START", scenarioId })
      try {
        const scenario = scenarios.find((s) => s.id === scenarioId)
        if (scenario) {
          await channel.triggerScenario(scenario)
        }
        dispatch({ type: "TRIGGER_SUCCESS", scenarioId })
      } catch (err: any) {
        dispatch({
          type: "SET_ERROR",
          error: err?.message ?? "Failed to trigger scenario",
        })
      }
    },
    [channel, scenarios]
  )

  const resetScenario = useCallback(async () => {
    dispatch({ type: "RESET_START" })
    try {
      await channel.resetScenario()
      dispatch({ type: "RESET_SUCCESS" })
    } catch (err: any) {
      dispatch({
        type: "SET_ERROR",
        error: err?.message ?? "Failed to reset scenario",
      })
    }
  }, [channel])

  return {
    state,
    selectScenario,
    resetScenario,
  }
}
