import { describe, test, expect, jest } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ScenarioDropdown } from "../../../../src/components/research/scenarios/scenarioDropdown"
import { Scenario } from "../../../../src/components/research/scenarios/types"

describe("ScenarioDropdown", () => {
  const scenarios: readonly Scenario[] = [
    { id: "scenario-1", name: "Standard Scenario", description: "Baseline" },
    { id: "scenario-2", name: "Stress Scenario", description: "High volume" },
  ]

  test("renders dropdown toggle with default button label", () => {
    render(<ScenarioDropdown scenarios={scenarios} />)

    const toggle = screen.getByRole("button", {
      name: "Skate testing scenarios",
    })
    expect(toggle).toBeInTheDocument()
  })

  test("renders dropdown toggle with custom button label", () => {
    render(
      <ScenarioDropdown
        scenarios={scenarios}
        buttonLabel="Custom Research Scenarios"
      />
    )

    const toggle = screen.getByRole("button", {
      name: "Custom Research Scenarios",
    })
    expect(toggle).toBeInTheDocument()
  })

  test("renders all scenarios and reset option in dropdown menu", async () => {
    render(
      <ScenarioDropdown scenarios={scenarios} resetLabel="Reset test view" />
    )

    const toggle = screen.getByRole("button", {
      name: "Skate testing scenarios",
    })
    await userEvent.click(toggle)

    scenarios.forEach((scenario) => {
      expect(
        screen.getByRole("button", { name: scenario.name })
      ).toBeInTheDocument()
    })
    expect(
      screen.getByRole("button", { name: "Reset test view" })
    ).toBeInTheDocument()
  })

  test("selecting a scenario triggers triggerScenario callback", async () => {
    const onTriggerScenario = jest.fn()
    render(
      <ScenarioDropdown
        scenarios={scenarios}
        onTriggerScenario={onTriggerScenario}
      />
    )

    const toggle = screen.getByRole("button", {
      name: "Skate testing scenarios",
    })
    await userEvent.click(toggle)

    const stressOption = screen.getByRole("button", {
      name: "Stress Scenario",
    })
    await userEvent.click(stressOption)

    await waitFor(() => {
      expect(onTriggerScenario).toHaveBeenCalledTimes(1)
    })

    const scenario = onTriggerScenario.mock.calls[0][0] as Scenario
    expect(scenario.id).toBe("scenario-2")
    expect(scenario.name).toBe("Stress Scenario")
  })

  test("selecting reset triggers onResetScenario callback", async () => {
    const onResetScenario = jest.fn()
    render(
      <ScenarioDropdown
        scenarios={scenarios}
        onResetScenario={onResetScenario}
      />
    )

    const toggle = screen.getByRole("button", {
      name: "Skate testing scenarios",
    })
    await userEvent.click(toggle)

    const resetOption = screen.getByRole("button", {
      name: "Reset view",
    })
    await userEvent.click(resetOption)

    await waitFor(() => {
      expect(onResetScenario).toHaveBeenCalledTimes(1)
    })
  })
})
