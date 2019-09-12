import React, { ReactElement, useContext } from "react"
import { ShuttleVehiclesContext } from "../contexts/shuttleVehiclesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { uniq } from "../helpers/array"
import { RunId, Vehicle } from "../realtime"
import { deselectShuttleRun, selectShuttleRun } from "../state"

interface KnownShuttle {
  name: string
  runId: RunId
}

const KNOWN_SHUTTLES: KnownShuttle[] = [
  {
    name: "Special",
    runId: "999-0555",
  },
  {
    name: "Blue",
    runId: "999-0501",
  },
  {
    name: "Green",
    runId: "999-0502",
  },
  {
    name: "Orange",
    runId: "999-0503",
  },
  {
    name: "Red",
    runId: "999-0504",
  },
  {
    name: "Commuter Rail",
    runId: "999-0505",
  },
]

const KNOWN_RUN_IDS: RunId[] = KNOWN_SHUTTLES.map(
  knownShuttle => knownShuttle.runId
)

const ShuttlePicker = ({}): ReactElement<HTMLDivElement> => {
  const shuttles: Vehicle[] = useContext(ShuttleVehiclesContext)
  const activeRunIds: RunId[] = uniq(shuttles
    .map(v => v.runId)
    .filter(runId => runId !== null) as RunId[])

  return (
    <div className="m-route-picker">
      <div className="m-route-picker__label">Run #</div>
      <ul className="m-route-picker__route-list">
        {KNOWN_SHUTTLES.map(knownShuttle => (
          <RunIdButton
            key={knownShuttle.runId}
            name={`${knownShuttle.name} ${formatRunId(knownShuttle.runId)}`}
            runId={knownShuttle.runId}
            isActive={activeRunIds.includes(knownShuttle.runId)}
          />
        ))}
        {activeRunIds.map(runId =>
          KNOWN_RUN_IDS.includes(runId) ? null : (
            <RunIdButton
              key={runId}
              name={formatRunId(runId)}
              runId={runId}
              isActive={true}
            />
          )
        )}
      </ul>
    </div>
  )
}

const RunIdButton = ({
  name,
  runId,
  isActive,
}: {
  name: string
  runId: RunId
  isActive: boolean
}): ReactElement<HTMLLIElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const isSelected = state.selectedShuttleRunIds.includes(runId)
  const selectedClass = isActive
    ? isSelected
      ? "m-route-picker__route-list-button--selected"
      : "m-route-picker__route-list-button--unselected"
    : "m-route-picker__route-list-button--disabled"

  const onClick = isActive
    ? isSelected
      ? () => dispatch(deselectShuttleRun(runId))
      : () => dispatch(selectShuttleRun(runId))
    : // tslint:disable-next-line: no-empty
      () => {}
  return (
    <li>
      <button
        className={`m-route-picker__route-list-button ${selectedClass}`}
        onClick={onClick}
        disabled={!isActive}
      >
        {name}
      </button>
    </li>
  )
}

export const formatRunId = (runId: RunId): string => runId.replace(/-0*/, " ")

export default ShuttlePicker
