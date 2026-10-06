import React, { ReactElement } from "react"
import { Dropdown } from "react-bootstrap"
import { joinClasses } from "../../../helpers/dom"
import { ResearchScenario } from "./types"
import {
  useResearchScenarioDropdown,
  UseResearchScenarioDropdownOptions,
} from "./useResearchScenarioDropdown"

export interface ResearchScenarioDropdownProps<
  T = unknown,
  Id extends string = string,
> extends UseResearchScenarioDropdownOptions<T, Id> {
  scenarios: readonly ResearchScenario<T, Id>[]
  buttonLabel?: string
  resetLabel?: string
  className?: string
}

export const ResearchScenarioDropdown = <
  T = unknown,
  Id extends string = string,
>({
  scenarios,
  socket,
  topic,
  buttonLabel = "Skate testing scenarios",
  resetLabel = "Reset view",
  onTriggerScenario,
  onResetScenario,
  className = "",
}: ResearchScenarioDropdownProps<T, Id>): ReactElement => {
  const { state, selectScenario, resetScenario } = useResearchScenarioDropdown<
    T,
    Id
  >({
    scenarios,
    socket,
    topic,
    onTriggerScenario,
    onResetScenario,
  })

  return (
    <div
      className={joinClasses([
        "c-research-scenario-dropdown",
        "border-box",
        "inherit-box",
        className,
      ])}
    >
      <Dropdown className="border-box inherit-box">
        <Dropdown.Toggle
          id="research-scenario-dropdown-toggle"
          variant="secondary"
          className="c-research-scenario-dropdown__toggle"
          disabled={state.isBroadcasting}
        >
          {state.isBroadcasting ? "Broadcasting..." : buttonLabel}
        </Dropdown.Toggle>

        <Dropdown.Menu className="c-research-scenario-dropdown__menu border-box inherit-box">
          {scenarios.map((scenario) => (
            <Dropdown.Item
              key={scenario.id}
              active={state.activeScenarioId === scenario.id}
              onClick={() => selectScenario(scenario.id)}
              className="c-research-scenario-dropdown__item"
            >
              {scenario.name}
            </Dropdown.Item>
          ))}
          <Dropdown.Divider />
          <Dropdown.Item
            onClick={resetScenario}
            className="c-research-scenario-dropdown__item c-research-scenario-dropdown__item--reset text-danger"
          >
            {resetLabel}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  )
}

export default ResearchScenarioDropdown
