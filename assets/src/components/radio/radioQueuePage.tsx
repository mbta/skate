import React, { ReactElement, useCallback, useState } from "react"
import { RttQueue } from "./rtts"
import { ScenarioDropdown } from "../research/scenarios"
import {
  RTT_QUEUE_SCENARIO_TOPIC,
  RttQueueScenario,
  SAMPLE_RTT_QUEUE_SCENARIOS,
} from "./rttQueueScenarios"

export const RadioQueuePage = (): ReactElement<HTMLDivElement> => {
  const [activeScenario, setActiveScenario] =
    useState<RttQueueScenario | null>(null)

  const handleTriggerScenario = useCallback((scenario: RttQueueScenario) => {
    setActiveScenario(scenario)
  }, [])

  const handleResetScenario = useCallback(() => {
    setActiveScenario(null)
  }, [])

  return (
    <div className="l-page c-radio-queue-page">
      <div className="h-100 overflow-y-auto p-4 bg-white">
        <ScenarioDropdown
          scenarios={SAMPLE_RTT_QUEUE_SCENARIOS}
          topic={RTT_QUEUE_SCENARIO_TOPIC}
          onTriggerScenario={handleTriggerScenario}
          onResetScenario={handleResetScenario}
          className="mb-4"
        />
        <RttQueue
          key={activeScenario?.id ?? "default"}
          initialState={activeScenario?.data}
        />
      </div>
    </div>
  )
}

export default RadioQueuePage
