import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import {
  BlueLineIcon,
  CommuterRailIcon,
  GreenLineIcon,
  OrangeLineIcon,
  RedLineIcon,
} from "../helpers/icon"
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
import ShuttlePickerContainer from "./shuttlePickerContainer"

interface Props {
  shuttles: Vehicle[] | null
}

interface KnownShuttle {
  name: string
  runId: RunId
  icon?: JSX.Element
}

const KNOWN_SHUTTLES: KnownShuttle[] = [
  {
    name: "Special",
    runId: "999-0555",
  },
  {
    name: "Blue",
    runId: "999-0501",
    icon: <BlueLineIcon />,
  },
  {
    name: "Green",
    runId: "999-0502",
    icon: <GreenLineIcon />,
  },
  {
    name: "Orange",
    runId: "999-0503",
    icon: <OrangeLineIcon />,
  },
  {
    name: "Red",
    runId: "999-0504",
    icon: <RedLineIcon />,
  },
  {
    name: "CR",
    runId: "999-0505",
    icon: <CommuterRailIcon />,
  },
]

const KNOWN_RUN_IDS: RunId[] = KNOWN_SHUTTLES.map(
  (knownShuttle) => knownShuttle.runId
)

const ShuttlePicker = ({ shuttles }: Props): ReactElement<HTMLDivElement> => {
  const shuttleRoutes: Route[] | null = useShuttleRoutes()

  return (
    <ShuttlePickerContainer>
      <div className="c-shuttle-picker u-hideable">
        {shuttles === null ? (
          <Loading />
        ) : (
          <>
            <RunIds shuttles={shuttles} />
            <Routes shuttleRoutes={shuttleRoutes} />
          </>
        )}
      </div>
    </ShuttlePickerContainer>
  )
}

const RunIds = ({ shuttles }: { shuttles: Vehicle[] }) => (
  <>
    <div className="c-shuttle-picker__label">Run #</div>
    <ul className="c-shuttle-picker__route-list c-shuttle-picker__shuttle-run-list">
      <RunIdButtons shuttles={shuttles} />
    </ul>
  </>
)

const RunIdButtons = ({ shuttles }: { shuttles: Vehicle[] }) => {
  const runCounts = activeRunCounts(shuttles)
  const activeRunIds = Object.keys(runCounts).filter((runId) => runId !== "all")

  return (
    <>
      <AllSpecialsButton count={runCounts.all} />
      {KNOWN_SHUTTLES.map((knownShuttle) => (
        <RunIdButton
          key={knownShuttle.runId}
          name={`${knownShuttle.name} ${formatRunId(knownShuttle.runId)}`}
          icon={knownShuttle.icon}
          count={runCounts[knownShuttle.runId]}
          runId={knownShuttle.runId}
          isActive={activeRunIds.includes(knownShuttle.runId)}
        />
      ))}
      {activeRunIds.map((runId) =>
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
  icon,
  count,
  runId,
  isActive,
}: {
  name: string
  icon?: JSX.Element
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
    : () => {}

  return (
    <RunButton
      name={name}
      icon={icon}
      count={count}
      isActive={isActive}
      isSelected={isSelected}
      onClick={onClick}
    />
  )
}

const RunButton = ({
  name,
  icon,
  count,
  isActive,
  isSelected,
  onClick,
}: {
  name: string
  icon?: JSX.Element
  count?: number
  isActive: boolean
  isSelected: boolean
  onClick: () => void
}): ReactElement<HTMLElement> => {
  const selectedClass = isActive
    ? isSelected
      ? "c-shuttle-picker__route-list-button--selected"
      : "c-shuttle-picker__route-list-button--unselected"
    : "c-shuttle-picker__route-list-button--disabled"
  return (
    <li>
      <button
        className={`c-shuttle-picker__route-list-button c-shuttle-picker__route-list-button--with-count ${selectedClass}`}
        onClick={onClick}
        disabled={!isActive}
      >
        <span className="c-shuttle-picker__route-list-button-name">
          {icon}
          {name}
        </span>
        <span className="c-shuttle-picker__route-list-button-count">
          {count !== undefined && count}
        </span>
      </button>
    </li>
  )
}

const Routes = ({ shuttleRoutes }: { shuttleRoutes: Route[] | null }) => (
  <>
    <div className="c-shuttle-picker__label">Routes</div>
    {shuttleRoutes && (
      <ul className="c-shuttle-picker__route-list c-shuttle-picker__shuttle-route-list">
        <RouteButtons shuttleRoutes={shuttleRoutes} />
      </ul>
    )}
  </>
)

const RouteButtons = ({ shuttleRoutes }: { shuttleRoutes: Route[] }) => (
  <>
    {Object.values(subwayRoutes).map((subwayRoute) => (
      <RouteButton route={subwayRoute} key={`route-button-${subwayRoute.id}`} />
    ))}
    {shuttleRoutes.map((shuttleRoute) => (
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
    ? "c-shuttle-picker__route-list-button--selected"
    : "c-shuttle-picker__route-list-button--unselected"

  const toggleRoute = isSelected
    ? () => dispatch(deselectShuttleRoute(id))
    : () => dispatch(selectShuttleRoute(id))

  return (
    <li>
      <button
        className={`c-shuttle-picker__route-list-button ${selectedClass}`}
        onClick={toggleRoute}
      >
        {name}
      </button>
    </li>
  )
}

export const formatRunId = (runId: RunId): string => runId.replace(/-0*/, " ")

export default ShuttlePicker
