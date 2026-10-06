import { describe, test, expect, jest } from "@jest/globals"
import { renderHook, act } from "@testing-library/react"
import { useScenarioDropdown } from "../../../../src/components/research/scenarios/useScenarioDropdown"
import { Scenario } from "../../../../src/components/research/scenarios/types"

describe("useScenarioDropdown", () => {
  const scenarios: readonly Scenario[] = [
    { id: "s1", name: "Scenario 1", description: "Desc 1" },
    { id: "s2", name: "Scenario 2", description: "Desc 2" },
  ]

  test("initializes with default state", () => {
    const { result } = renderHook(() => useScenarioDropdown({ scenarios }))

    expect(result.current.state).toEqual({
      activeScenarioId: null,
      isBroadcasting: false,
      error: null,
    })
  })

  test("selectScenario triggers scenario and updates activeScenarioId", async () => {
    const onTriggerScenario = jest.fn<(scenario: Scenario) => void>()
    const { result } = renderHook(() =>
      useScenarioDropdown({ scenarios, onTriggerScenario })
    )

    await act(async () => {
      await result.current.selectScenario("s1")
    })

    expect(result.current.state.activeScenarioId).toBe("s1")
    expect(result.current.state.isBroadcasting).toBe(false)
    expect(result.current.state.error).toBeNull()

    expect(onTriggerScenario).toHaveBeenCalledTimes(1)
    const triggeredScenario = onTriggerScenario.mock.calls[0][0]
    expect(triggeredScenario.id).toBe("s1")
    expect(triggeredScenario.name).toBe("Scenario 1")
  })

  test("resetScenario triggers reset and clears activeScenarioId", async () => {
    const onResetScenario = jest.fn<() => void>()
    const { result } = renderHook(() =>
      useScenarioDropdown({ scenarios, onResetScenario })
    )

    await act(async () => {
      await result.current.selectScenario("s2")
    })
    expect(result.current.state.activeScenarioId).toBe("s2")

    await act(async () => {
      await result.current.resetScenario()
    })

    expect(result.current.state.activeScenarioId).toBeNull()
    expect(result.current.state.isBroadcasting).toBe(false)
    expect(result.current.state.error).toBeNull()
    expect(onResetScenario).toHaveBeenCalledTimes(1)
  })
})
