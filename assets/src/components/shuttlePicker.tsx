import React, { ReactElement, useContext } from "react"
import { ShuttleVehiclesContext } from "../contexts/shuttleVehiclesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { uniq } from "../helpers/array"
import useShuttleRoutes from "../hooks/useShuttleRoutes"
import { RunId, Vehicle } from "../realtime"
import { Route } from "../schedule"
import {
  deselectShuttleRoute,
  deselectShuttleRun,
  selectShuttleRoute,
  selectShuttleRun,
} from "../state"
import Loading from "./loading"
import PickerContainer, { Width } from "./pickerContainer"

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
  const shuttles: Vehicle[] | null = useContext(ShuttleVehiclesContext)
  const shuttleRoutes: Route[] | null = useShuttleRoutes()

  return (
    <PickerContainer width={Width.Wide}>
      <div className="m-route-picker">
        {shuttles === null ? (
          <Loading />
        ) : (
          <>
            <RunIds shuttles={shuttles} />
            <Routes shuttleRoutes={shuttleRoutes} />
          </>
        )}
      </div>
    </PickerContainer>
  )
}

const RunIds = ({ shuttles }: { shuttles: Vehicle[] }) => (
  <>
    <div className="m-route-picker__label">Run #</div>
    <ul className="m-route-picker__route-list m-route-picker__shuttle-run-list">
      <RunIdButtons shuttles={shuttles} />
    </ul>
  </>
)

const RunIdButtons = ({ shuttles }: { shuttles: Vehicle[] }) => {
  const activeRunIds: RunId[] = uniq(shuttles
    .map(v => v.runId)
    .filter(runId => runId !== null) as RunId[])

  return (
    <>
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
    </>
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

const Routes = ({ shuttleRoutes }: { shuttleRoutes: Route[] | null }) => (
  <>
    <div className="m-route-picker__label">Routes</div>
    {shuttleRoutes && (
      <ul className="m-route-picker__route-list m-route-picker__shuttle-route-list">
        <ShuttleRouteButtons shuttleRoutes={shuttleRoutes} />
      </ul>
    )}
  </>
)

const ShuttleRouteButtons = ({ shuttleRoutes }: { shuttleRoutes: Route[] }) => (
  <>
    {shuttleRoutes.map(shuttleRoute => (
      <RouteButton
        route={shuttleRoute}
        key={`route-button-${shuttleRoute.id}`}
      />
    ))}
  </>
)

const RouteButton = ({ route: { id, name } }: { route: Route }) => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const isSelected = state.selectedShuttleRouteIds.includes(id)
  const selectedClass = isSelected
    ? "m-route-picker__route-list-button--selected"
    : "m-route-picker__route-list-button--unselected"

  const toggleRoute = isSelected
    ? () => dispatch(deselectShuttleRoute(id))
    : () => dispatch(selectShuttleRoute(id))

  return (
    <li>
      <button
        className={`m-route-picker__route-list-button ${selectedClass}`}
        onClick={toggleRoute}
      >
        {name}
      </button>
    </li>
  )
}

export const formatRunId = (runId: RunId): string => runId.replace(/-0*/, " ")

export default ShuttlePicker
