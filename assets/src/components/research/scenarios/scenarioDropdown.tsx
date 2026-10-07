import React, { ReactElement } from "react"
import { Dropdown } from "react-bootstrap"
import { joinClasses } from "../../../helpers/dom"
import { Scenario } from "./types"
import {
  useScenarioDropdown,
  UseScenarioDropdownOptions,
} from "./useScenarioDropdown"

export interface ScenarioDropdownProps<
  T = unknown,
  Id extends string = string,
> extends UseScenarioDropdownOptions<T, Id> {
  scenarios: readonly Scenario<T, Id>[]
  buttonLabel?: string
  resetLabel?: string
  className?: string
}

export const ScenarioDropdown = <T = unknown, Id extends string = string>({
  scenarios,
  socket,
  topic,
  buttonLabel = "Skate testing scenarios",
  resetLabel = "Reset view",
  onTriggerScenario,
  onResetScenario,
  className = "",
}: ScenarioDropdownProps<T, Id>): ReactElement => {
  const { state, selectScenario, resetScenario } = useScenarioDropdown<T, Id>({
    scenarios,
    socket,
    topic,
    onTriggerScenario,
    onResetScenario,
  })

  return (
    <div
      className={joinClasses([
        "c-scenario-dropdown",
        "border-box",
        "inherit-box",
        className,
      ])}
    >
      <Dropdown className="border-box inherit-box">
        <Dropdown.Toggle
          id="scenario-dropdown-toggle"
          variant="secondary"
          className="c-scenario-dropdown__toggle"
          disabled={state.isBroadcasting}
        >
          {state.isBroadcasting ? "Broadcasting..." : buttonLabel}
        </Dropdown.Toggle>

        <Dropdown.Menu className="c-scenario-dropdown__menu border-box inherit-box">
          {scenarios.map((scenario) => (
            <Dropdown.Item
              key={scenario.id}
              active={state.activeScenarioId === scenario.id}
              onClick={() => selectScenario(scenario.id)}
              className="c-scenario-dropdown__item"
            >
              {scenario.name}
            </Dropdown.Item>
          ))}
          <Dropdown.Divider />
          <Dropdown.Item
            onClick={resetScenario}
            className="c-scenario-dropdown__item c-scenario-dropdown__item--reset text-danger"
          >
            {resetLabel}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  )
}

export default ScenarioDropdown
