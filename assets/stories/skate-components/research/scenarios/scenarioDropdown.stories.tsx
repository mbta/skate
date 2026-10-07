import type { Meta, StoryObj } from "@storybook/react-webpack5"
import React, { useState } from "react"
import { ScenarioDropdown } from "../../../../src/components/research/scenarios/scenarioDropdown"
import { Scenario } from "../../../../src/components/research/scenarios/types"

const SAMPLE_SCENARIOS: readonly Scenario<string>[] = [
  {
    id: "scenario-1",
    name: "Baseline Scenario",
    description: "Standard initial state for research session",
    data: "sample-baseline-data",
  },
  {
    id: "scenario-2",
    name: "High Stress Scenario",
    description: "Stress case with high volume of activity",
    data: "sample-stress-data",
  },
  {
    id: "scenario-3",
    name: "Edge Case Scenario",
    description: "Unusual inputs and rare state transitions",
    data: "sample-edge-case-data",
  },
]

const meta = {
  component: ScenarioDropdown,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    scenarios: SAMPLE_SCENARIOS,
  },
  decorators: [
    (StoryFn) => (
      <div
        style={{
          minHeight: "100vh",
          padding: "1.5rem",
          boxSizing: "border-box",
          backgroundColor: "#f2f3f5",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <StoryFn />
      </div>
    ),
  ],
} satisfies Meta<typeof ScenarioDropdown>

export default meta
type Story = StoryObj<typeof ScenarioDropdown>

export const Default: Story = {}

export const InteractiveWithOutput: Story = {
  render: () => {
    const [activeScenario, setActiveScenario] =
      useState<Scenario<string> | null>(null)

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <ScenarioDropdown
            scenarios={SAMPLE_SCENARIOS}
            onTriggerScenario={(scenario) => setActiveScenario(scenario)}
            onResetScenario={() => setActiveScenario(null)}
          />
        </div>

        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fff",
            borderRadius: "4px",
            border: "1px solid #dee2e6",
          }}
        >
          <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>
            Active Scenario Broadcast State
          </h4>
          {activeScenario ? (
            <div>
              <p style={{ margin: "0 0 0.25rem 0" }}>
                <strong>ID:</strong> {activeScenario.id}
              </p>
              <p style={{ margin: "0 0 0.25rem 0" }}>
                <strong>Name:</strong> {activeScenario.name}
              </p>
              <p style={{ margin: "0 0 0.25rem 0" }}>
                <strong>Description:</strong> {activeScenario.description}
              </p>
              <p style={{ margin: "0" }}>
                <strong>Data payload:</strong> {activeScenario.data}
              </p>
            </div>
          ) : (
            <p style={{ margin: 0, color: "#6c757d" }}>
              No scenario currently triggered (default view).
            </p>
          )}
        </div>
      </div>
    )
  },
}
