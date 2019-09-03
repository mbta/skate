import React, { ReactElement, useContext } from "react"
import { ShuttleVehiclesContext } from "../contexts/shuttleVehiclesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { Vehicle } from "../realtime"
import { deselectShuttleRun, selectShuttleRun } from "../state"

const ShuttlePicker = ({}): ReactElement<HTMLDivElement> => {
  const shuttles = useContext(ShuttleVehiclesContext)
  return (
    <div className="m-route-picker">
      <div className="m-route-picker__label">Run #</div>
      <ul className="m-route-picker__route-list">
        {renderRunIdButtons(shuttles)}
      </ul>
    </div>
  )
}

const renderRunIdButtons = (
  shuttles: Vehicle[]
): Array<ReactElement<HTMLLIElement>> => {
  const runIds = new Set(shuttles.map(v => v.runId).sort())
  const acc: Array<ReactElement<HTMLLIElement>> = []

  runIds.forEach(runId => acc.push(<RunIdButton key={runId!} runId={runId!} />))

  return acc
}

const RunIdButton = ({
  runId,
}: {
  runId: string
}): ReactElement<HTMLLIElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const isSelected = state.selectedShuttleRunIds.includes(runId)
  const selectedClass = isSelected
    ? "m-route-picker__route-list-button--selected"
    : ""

  const onClick = isSelected
    ? () => dispatch(deselectShuttleRun(runId))
    : () => dispatch(selectShuttleRun(runId))
  return (
    <li>
      <button
        className={`m-route-picker__route-list-button ${selectedClass}`}
        onClick={onClick}
      >
        {runId}
      </button>
    </li>
  )
}

export default ShuttlePicker
