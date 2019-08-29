import React, { ReactElement, useContext } from "react"
import { ShuttleVehiclesContext } from "../contexts/shuttleVehiclesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { Vehicle } from "../realtime"
import { deselectShuttleRun, selectShuttleRun } from "../state"

const ShuttlePicker = ({}): ReactElement<HTMLDivElement> => {
  const shuttles = useContext(ShuttleVehiclesContext)
  const shuttlesByRunId = shuttles.reduce(groupByRunId, {})
  const runIds = Object.keys(shuttlesByRunId)
  return (
    <div className="m-route-picker">
      <div className="m-route-picker__label">Run #</div>
      <ul className="m-route-picker__route-list">
        {shuttles.length ? (
          runIds.map(id => <RunIdButton key={id} runId={id} />)
        ) : (
          <li>Loading...</li>
        )}
      </ul>
    </div>
  )
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

interface ShuttlesByRunId {
  [runId: string]: Vehicle[]
}

const groupByRunId = (acc: ShuttlesByRunId, shuttle: Vehicle) => ({
  ...acc,
  [shuttle.runId!]: (acc[shuttle.runId!] || []).concat(shuttle),
})

export default ShuttlePicker
