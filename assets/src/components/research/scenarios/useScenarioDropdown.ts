import { useCallback, useReducer } from "react"
import { Socket } from "phoenix"
import { initialScenarioState, scenarioReducer } from "./scenarioReducer"
import { Scenario, ScenarioState } from "./types"
import { useScenarioChannel } from "./useScenarioChannel"

export interface UseScenarioDropdownOptions<
  T = unknown,
  Id extends string = string,
> {
  scenarios?: readonly Scenario<T, Id>[]
  socket?: Socket
  topic?: string
  onTriggerScenario?: (scenario: Scenario<T, Id>) => void
  onResetScenario?: () => void
}

export interface UseScenarioDropdownResult<Id extends string = string> {
  state: ScenarioState<Id>
  selectScenario: (scenarioId: Id) => Promise<void>
  resetScenario: () => Promise<void>
}

/**
 * Custom hook orchestrating scenario selection,
 * Phoenix channel broadcasting, and state transitions for scenario dropdowns.
 */
export const useScenarioDropdown = <T = unknown, Id extends string = string>(
  options: UseScenarioDropdownOptions<T, Id> = {}
): UseScenarioDropdownResult<Id> => {
  const {
    scenarios = [],
    socket,
    topic,
    onTriggerScenario,
    onResetScenario,
  } = options

  const [state, dispatch] = useReducer(
    scenarioReducer<Id>,
    initialScenarioState as ScenarioState<Id>
  )

  const channel = useScenarioChannel<T, Id>({
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
