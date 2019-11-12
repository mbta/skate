import React, { ReactElement, useContext } from "react"
import { ShuttleVehiclesContext } from "../contexts/shuttleVehiclesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useShuttleRoutes from "../hooks/useShuttleRoutes"
import { SubwayRoute, subwayRoutes } from "../models/subwayRoute"
import { RunId, Vehicle } from "../realtime"
import { Route } from "../schedule"
import {
  deselectAllShuttleRuns,
  deselectShuttleRoute,
  deselectShuttleRun,
  selectAllShuttleRuns,
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
  { name: "Blue", runId: "999-0610" },
  { name: "Blue", runId: "999-0611" },
  { name: "Blue", runId: "999-0612" },
  { name: "Blue", runId: "999-0613" },
  { name: "Blue", runId: "999-0614" },
  { name: "Blue", runId: "999-0615" },
  { name: "Blue", runId: "999-0616" },
  { name: "Blue", runId: "999-0617" },
  { name: "Blue", runId: "999-0618" },
  { name: "Blue", runId: "999-0619" },
  { name: "GL Trunk", runId: "999-0620" },
  { name: "B Branch", runId: "999-0621" },
  { name: "C Branch", runId: "999-0622" },
  { name: "D Branch", runId: "999-0623" },
  { name: "E Branch", runId: "999-0624" },
  { name: "Green", runId: "999-0625" },
  { name: "Green", runId: "999-0626" },
  { name: "Green", runId: "999-0627" },
  { name: "Green", runId: "999-0628" },
  { name: "Green", runId: "999-0629" },
  { name: "Orange", runId: "999-0630" },
  { name: "Orange", runId: "999-0631" },
  { name: "Orange", runId: "999-0632" },
  { name: "Orange", runId: "999-0633" },
  { name: "Orange", runId: "999-0634" },
  { name: "Orange", runId: "999-0635" },
  { name: "Orange", runId: "999-0636" },
  { name: "Orange", runId: "999-0637" },
  { name: "Orange", runId: "999-0638" },
  { name: "Orange", runId: "999-0639" },
  { name: "RL Trunk", runId: "999-0640" },
  { name: "Ashmont", runId: "999-0641" },
  { name: "Braintree", runId: "999-0642" },
  { name: "Red", runId: "999-0643" },
  { name: "Red", runId: "999-0644" },
  { name: "Red", runId: "999-0645" },
  { name: "Red", runId: "999-0646" },
  { name: "Red", runId: "999-0647" },
  { name: "Red", runId: "999-0648" },
  { name: "Red", runId: "999-0649" },
  { name: "Mattapan", runId: "999-0650" },
  { name: "Mattapan", runId: "999-0651" },
  { name: "Mattapan", runId: "999-0652" },
  { name: "Mattapan", runId: "999-0653" },
  { name: "Mattapan", runId: "999-0654" },
  { name: "Mattapan", runId: "999-0655" },
  { name: "Mattapan", runId: "999-0656" },
  { name: "Mattapan", runId: "999-0657" },
  { name: "Mattapan", runId: "999-0658" },
  { name: "Mattapan", runId: "999-0659" },
  { name: "CR North", runId: "999-0660" },
  { name: "Fitchburg", runId: "999-0661" },
  { name: "Lowell", runId: "999-0662" },
  { name: "Haverhill", runId: "999-0663" },
  { name: "Newburyport / Rockport", runId: "999-0664" },
  { name: "CR North", runId: "999-0665" },
  { name: "CR North", runId: "999-0666" },
  { name: "CR North", runId: "999-0667" },
  { name: "CR North", runId: "999-0668" },
  { name: "CR North", runId: "999-0669" },
  { name: "CR South", runId: "999-0670" },
  { name: "Worcester", runId: "999-0671" },
  { name: "Needham", runId: "999-0672" },
  { name: "Franklin", runId: "999-0673" },
  { name: "Providence / Stoughton", runId: "999-0674" },
  { name: "Fairmount", runId: "999-0675" },
  { name: "Middleborough / Lakeville", runId: "999-0676" },
  { name: "Kingston / Plymouth", runId: "999-0677" },
  { name: "Greenbush", runId: "999-0678" },
  { name: "CR South", runId: "999-0679" },
  { name: "Special", runId: "999-0555" },
  { name: "Blue", runId: "999-0501" },
  { name: "Green", runId: "999-0502" },
  { name: "Orange", runId: "999-0503" },
  { name: "Red", runId: "999-0504" },
  { name: "CR", runId: "999-0505" },
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
  const runCounts = activeRunCounts(shuttles)
  const activeRunIds = Object.keys(runCounts).filter(runId => runId !== "all")

  return (
    <>
      <AllSpecialsButton count={runCounts.all} />
      {KNOWN_SHUTTLES.map(knownShuttle => (
        <RunIdButton
          key={knownShuttle.runId}
          name={`${knownShuttle.name} ${formatRunId(knownShuttle.runId)}`}
          count={runCounts[knownShuttle.runId]}
          runId={knownShuttle.runId}
          isActive={activeRunIds.includes(knownShuttle.runId)}
        />
      ))}
      {activeRunIds.map(runId =>
        KNOWN_RUN_IDS.includes(runId) ? null : (
          <RunIdButton
            key={runId}
            name={formatRunId(runId)}
            count={runCounts[runId]}
            runId={runId}
            isActive={true}
          />
        )
      )}
    </>
  )
}

interface ActiveRunCounts {
  [runId: string]: number
}
export const activeRunCounts = (shuttles: Vehicle[]): ActiveRunCounts =>
  shuttles.reduce((acc, { runId }) => {
    if (runId === null) {
      return acc
    }

    return {
      ...acc,
      [runId]: acc[runId] !== undefined ? acc[runId] + 1 : 1,
      all: acc.all !== undefined ? acc.all + 1 : 1,
    }
  }, {} as ActiveRunCounts)

const AllSpecialsButton = ({
  count,
}: {
  count: number
}): ReactElement<HTMLElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const isSelected = state.selectedShuttleRunIds === "all"

  const toggleAllShuttleRuns = () =>
    isSelected
      ? dispatch(deselectAllShuttleRuns())
      : dispatch(selectAllShuttleRuns())

  return (
    <RunButton
      name="All Specials (999*)"
      count={count}
      isActive={true}
      isSelected={isSelected}
      onClick={toggleAllShuttleRuns}
    />
  )
}

const RunIdButton = ({
  name,
  count,
  runId,
  isActive,
}: {
  name: string
  count?: number
  runId: RunId
  isActive: boolean
}): ReactElement<HTMLLIElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const isSelected =
    state.selectedShuttleRunIds !== "all" &&
    state.selectedShuttleRunIds.includes(runId)

  const onClick = isActive
    ? isSelected
      ? () => dispatch(deselectShuttleRun(runId))
      : () => dispatch(selectShuttleRun(runId))
    : // tslint:disable-next-line: no-empty
      () => {}

  return (
    <RunButton
      name={name}
      count={count}
      isActive={isActive}
      isSelected={isSelected}
      onClick={onClick}
    />
  )
}

const RunButton = ({
  name,
  count,
  isActive,
  isSelected,
  onClick,
}: {
  name: string
  count?: number
  isActive: boolean
  isSelected: boolean
  onClick: () => void
}): ReactElement<HTMLElement> => {
  const selectedClass = isActive
    ? isSelected
      ? "m-route-picker__route-list-button--selected"
      : "m-route-picker__route-list-button--unselected"
    : "m-route-picker__route-list-button--disabled"
  return (
    <li>
      <button
        className={`m-route-picker__route-list-button m-route-picker__route-list-button--with-count ${selectedClass}`}
        onClick={onClick}
        disabled={!isActive}
      >
        <span className="m-route-picker__route-list-button-name">{name}</span>
        <span className="m-route-picker__route-list-button-count">
          {count !== undefined && count}
        </span>
      </button>
    </li>
  )
}

const Routes = ({ shuttleRoutes }: { shuttleRoutes: Route[] | null }) => (
  <>
    <div className="m-route-picker__label">Routes</div>
    {shuttleRoutes && (
      <ul className="m-route-picker__route-list m-route-picker__shuttle-route-list">
        <RouteButtons shuttleRoutes={shuttleRoutes} />
      </ul>
    )}
  </>
)

const RouteButtons = ({ shuttleRoutes }: { shuttleRoutes: Route[] }) => (
  <>
    {subwayRoutes.map(subwayRoute => (
      <RouteButton route={subwayRoute} key={`route-button-${subwayRoute.id}`} />
    ))}
    {shuttleRoutes.map(shuttleRoute => (
      <RouteButton
        route={shuttleRoute}
        key={`route-button-${shuttleRoute.id}`}
      />
    ))}
  </>
)

const RouteButton = ({
  route: { id, name },
}: {
  route: Route | SubwayRoute
}) => {
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
