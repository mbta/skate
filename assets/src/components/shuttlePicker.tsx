import React, { ReactElement, useContext } from "react"
import { ShuttleVehiclesContext } from "../contexts/shuttleVehiclesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useShuttleRoutes from "../hooks/useShuttleRoutes"
import {
  isMatchingShuttleRunSelection,
  isRunIdShuttleRunSelection,
  matchesRunId,
  ShuttleRunSelection,
  ShuttleRunSelectionType,
} from "../models/shuttleRunSelection"
import { SubwayRoute, subwayRoutes } from "../models/subwayRoute"
import { RunId, Vehicle } from "../realtime"
import { Route } from "../schedule"
import {
  deselectAllShuttleRuns,
  deselectShuttleRouteId,
  deselectShuttleRun,
  selectAllShuttleRuns,
  selectShuttleRouteId,
  selectShuttleRun,
} from "../state"
import Loading from "./loading"
import PickerContainer, { Width } from "./pickerContainer"

interface PresetRunSelectionButton {
  name: string
  runSelection: ShuttleRunSelection
}

const PRESET_RUN_SELECTION_BUTTONS: PresetRunSelectionButton[] = [
  {
    name: "Blue 999 61*",
    runSelection: {
      type: ShuttleRunSelectionType.Filter,
      filter: /999-061.*/,
    },
  },
  {
    name: "Green 999 62*",
    runSelection: {
      type: ShuttleRunSelectionType.Filter,
      filter: /999-062.*/,
    },
  },
  {
    name: "GL Trunk",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0620" },
  },
  {
    name: "B Branch",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0621" },
  },
  {
    name: "C Branch",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0622" },
  },
  {
    name: "D Branch",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0623" },
  },
  {
    name: "E Branch",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0624" },
  },
  {
    name: "Orange 999 63*",
    runSelection: {
      type: ShuttleRunSelectionType.Filter,
      filter: /999-063.*/,
    },
  },
  {
    name: "Red 999 64*",
    runSelection: {
      type: ShuttleRunSelectionType.Filter,
      filter: /999-064.*/,
    },
  },
  {
    name: "RL Trunk",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0640" },
  },
  {
    name: "Ashmont",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0641" },
  },
  {
    name: "Braintree",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0642" },
  },
  {
    name: "Mattapan 999 65*",
    runSelection: {
      type: ShuttleRunSelectionType.Filter,
      filter: /999-065.*/,
    },
  },
  {
    name: "CR North 999 66*",
    runSelection: {
      type: ShuttleRunSelectionType.Filter,
      filter: /999-066.*/,
    },
  },
  {
    name: "Fitchburg",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0661" },
  },
  {
    name: "Lowell",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0662" },
  },
  {
    name: "Haverhill",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0663" },
  },
  {
    name: "Newburyport / Rockport",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0664" },
  },
  {
    name: "CR South 999 67*",
    runSelection: {
      type: ShuttleRunSelectionType.Filter,
      filter: /999-067.*/,
    },
  },
  {
    name: "Worcester",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0671" },
  },
  {
    name: "Needham",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0672" },
  },
  {
    name: "Franklin",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0673" },
  },
  {
    name: "Providence / Stoughton",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0674" },
  },
  {
    name: "Fairmount",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0675" },
  },
  {
    name: "Middleborough / Lakeville",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0676" },
  },
  {
    name: "Kingston / Plymouth",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0677" },
  },
  {
    name: "Greenbush",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0678" },
  },
  {
    name: "Special",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0555" },
  },
  {
    name: "Blue",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0501" },
  },
  {
    name: "Green",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0502" },
  },
  {
    name: "Orange",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0503" },
  },
  {
    name: "Red",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0504" },
  },
  {
    name: "CR",
    runSelection: { type: ShuttleRunSelectionType.RunId, runId: "999-0505" },
  },
]

const PRESET_RUN_IDS: RunId[] = PRESET_RUN_SELECTION_BUTTONS.reduce(
  (acc: RunId[], { runSelection }: PresetRunSelectionButton) =>
    isRunIdShuttleRunSelection(runSelection)
      ? [...acc, runSelection.runId]
      : acc,
  []
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

  const buttonKey = (
    presetRunSelectionButton: PresetRunSelectionButton
  ): string =>
    isRunIdShuttleRunSelection(presetRunSelectionButton.runSelection)
      ? presetRunSelectionButton.runSelection.runId
      : presetRunSelectionButton.runSelection.filter.toString()

  const presetRunSelectionButtonCount = ({
    runSelection,
  }: PresetRunSelectionButton): number | undefined => {
    if (isRunIdShuttleRunSelection(runSelection)) {
      return runCounts[runSelection.runId]
    }

    const filterCount = activeRunIds.reduce(
      (count, activeRunId) =>
        matchesRunId(runSelection, activeRunId)
          ? count + runCounts[activeRunId]
          : count,
      0
    )

    if (filterCount === 0) {
      return undefined
    } else {
      return filterCount
    }
  }

  const isPresetRunSelectionButtonActive = ({
    runSelection,
  }: PresetRunSelectionButton): boolean =>
    activeRunIds.some(activeRunId => matchesRunId(runSelection, activeRunId))

  return (
    <>
      <AllSpecialsButton count={runCounts.all} />
      {PRESET_RUN_SELECTION_BUTTONS.map(presetRunSelectionButton => (
        <RunIdButton
          key={buttonKey(presetRunSelectionButton)}
          name={buttonLabel(presetRunSelectionButton)}
          count={presetRunSelectionButtonCount(presetRunSelectionButton)}
          shuttleRunSelection={presetRunSelectionButton.runSelection}
          isActive={isPresetRunSelectionButtonActive(presetRunSelectionButton)}
        />
      ))}
      {activeRunIds.map(runId =>
        PRESET_RUN_IDS.includes(runId) ? null : (
          <RunIdButton
            key={runId}
            name={formatRunId(runId)}
            count={runCounts[runId]}
            shuttleRunSelection={{
              type: ShuttleRunSelectionType.RunId,
              runId,
            }}
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
  const isSelected = state.selectedShuttleRuns === "all"

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
  shuttleRunSelection,
  isActive,
}: {
  name: string
  count?: number
  shuttleRunSelection: ShuttleRunSelection
  isActive: boolean
}): ReactElement<HTMLLIElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const isSelected =
    state.selectedShuttleRuns !== "all" &&
    state.selectedShuttleRuns.some(selectedShuttleRun =>
      isMatchingShuttleRunSelection(selectedShuttleRun, shuttleRunSelection)
    )

  const onClick = isActive
    ? isSelected
      ? () => dispatch(deselectShuttleRun(shuttleRunSelection))
      : () => dispatch(selectShuttleRun(shuttleRunSelection))
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
    ? () => dispatch(deselectShuttleRouteId(id))
    : () => dispatch(selectShuttleRouteId(id))

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

const buttonLabel = ({
  name,
  runSelection,
}: PresetRunSelectionButton): string =>
  isRunIdShuttleRunSelection(runSelection)
    ? `${name} ${formatRunId(runSelection.runId)}`
    : name

export const formatRunId = (runId: RunId): string => runId.replace(/-0*/, " ")

export default ShuttlePicker
