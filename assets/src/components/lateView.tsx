import React, {
  Dispatch,
  ReactElement,
  createContext,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import DrawerTab from "../components/drawerTab"
import RoutesContext from "../contexts/routesContext"
import { VehiclesByRouteIdContext } from "../contexts/vehiclesByRouteIdContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import {
  bangIcon,
  lateViewGhostIcon,
  lateViewGhostWithWaiverIcon,
  upRightIcon,
} from "../helpers/icon"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import { flatten, uniqBy } from "../helpers/array"
import { isVehicle, isGhost } from "../models/vehicle"
import { Vehicle, Ghost, RunId, VehicleOrGhost } from "../realtime"
import { ByRouteId } from "../schedule"
import { Action, selectVehicle, toggleLateView } from "../state"
import {
  secondsToMinutes,
  formattedTime,
  dateFromEpochSeconds,
} from "../util/dateTime"
import { runIdToLabel } from "../helpers/vehicleLabel"
import { routeNameOrId } from "../util/route"

const compareGhosts = (a: Ghost, b: Ghost): number => {
  if (a.runId === null && b.runId !== null) {
    return 1
  }
  if (b.runId === null && a.runId !== null) {
    return -1
  }
  if (a.runId === null && b.runId === null) {
    return a.id.localeCompare(b.id)
  }
  return runIdToLabel(a.runId!).localeCompare(runIdToLabel(b.runId!))
}

const idIn = (runId: RunId, runIds: RunId[]): boolean =>
  runIds.some((idInList) => idInList === runId)

const remove = (removeFrom: RunId[], toRemove: RunId): RunId[] =>
  removeFrom.filter((idInList) => idInList === toRemove)

const difference = (removeFrom: RunId[], toRemove: RunId[]): RunId[] =>
  removeFrom.filter((id) => !idIn(id, toRemove))

const toggleRunIdInSet = (
  runId: RunId,
  runIdSet: RunId[],
  updateFunction: Dispatch<SetStateAction<RunId[]>>
): void => {
  if (idIn(runId, runIdSet)) {
    updateFunction(remove(runIdSet, runId))
  } else {
    updateFunction([...runIdSet, runId])
  }
}

// tslint:disable: no-empty
const LateViewContext = createContext<{
  selectedIds: RunId[]
  toggleCheckedState: (selectedId: RunId) => void
}>({
  selectedIds: [],
  toggleCheckedState: () => [],
})

// tslint:enable: no-empty

const LateView = (): ReactElement<HTMLElement> => {
  const [, dispatch] = useContext(StateDispatchContext)

  // This is getting to be a lot of state and a lot of interactions. In the
  // likely case that we add more functionality to this view, we might
  // want to refactor to use a reducer.

  const [selectedIds, setSelectedIds] = useState<RunId[]>([])
  const [hiddenIds, setHiddenIds] = useState<RunId[]>([])
  const [recentlyHiddenIds, setRecentlyHiddenIds] = useState<RunId[]>([])
  const [viewHidden, setViewHidden] = useState<boolean>(false)

  const toggleCheckedState = (id: RunId): void => {
    toggleRunIdInSet(id, selectedIds, setSelectedIds)
  }

  const hideSelectedRows: () => void = () => {
    setHiddenIds({
      ...hiddenIds,
      ...selectedIds,
    })
    setRecentlyHiddenIds(selectedIds)
    setSelectedIds([])
  }

  const unhideRecentlyHidden: () => void = () => {
    setHiddenIds(difference(hiddenIds, recentlyHiddenIds))
    setRecentlyHiddenIds([])
  }

  const clearRecentlyHidden: () => void = () => setRecentlyHiddenIds([])

  const toggleViewHidden: () => void = () => setViewHidden(!viewHidden)

  const nRowsSelected = selectedIds.length
  const anyRowsSelected = nRowsSelected > 0

  const nRecentlyHidden = recentlyHiddenIds.length
  const anyRecentlyHidden = nRecentlyHidden > 0

  const anyRowsHidden = hiddenIds.length > 0

  const vehiclesByRouteId: ByRouteId<VehicleOrGhost[]> = useContext(
    VehiclesByRouteIdContext
  )

  const vehiclesOrGhosts = uniqBy(
    flatten(Object.values(vehiclesByRouteId)),
    (vehicleOrGhost) => vehicleOrGhost.runId
  ).filter(
    (vehicleOrGhost) =>
      viewHidden ||
      (vehicleOrGhost.runId && !idIn(vehicleOrGhost.runId, hiddenIds))
  )

  const lateBusThreshold = 60 * 15
  const missingLogonThreshold = 60 * 45

  const withinMissingLogonThreshold = (ghost: Ghost) =>
    currentTime - (ghost.scheduledLogonTime as number) <= missingLogonThreshold

  const currentTime = useCurrentTimeSeconds()

  const ghostsToDisplay = vehiclesOrGhosts
    .filter(isGhost)
    .filter((ghost) => ghost.scheduledLogonTime !== null)

  const unsortedMissingLogons = ghostsToDisplay.filter(
    withinMissingLogonThreshold
  )
  const unsortedLateGhosts = ghostsToDisplay.filter(
    (ghost) => !withinMissingLogonThreshold(ghost)
  )

  const missingLogons = unsortedMissingLogons.sort(
    (a, b) =>
      (a.scheduledLogonTime as number) - (b.scheduledLogonTime as number)
  )

  const lateGhosts = unsortedLateGhosts.sort(compareGhosts)

  const lateBuses = vehiclesOrGhosts
    .filter(isVehicle)
    .filter((vehicle) => vehicle.scheduleAdherenceSecs >= lateBusThreshold)
    .sort((a, b) => b.scheduleAdherenceSecs - a.scheduleAdherenceSecs)

  return (
    <LateViewContext.Provider value={{ selectedIds, toggleCheckedState }}>
      <div className="m-late-view">
        <div className="m-late-view__content-wrapper">
          <div className="m-late-view__title">Late View</div>
          <div className="m-late-view__panels">
            <div className="m-late-view__panel m-late-view__missing-logons">
              <h2 className="m-late-view__panel-header m-late-view__missing-logons-panel-header">
                Missing logons{" "}
                {anyRowsHidden && (
                  <UnhideToggle
                    viewHidden={viewHidden}
                    toggleViewHidden={toggleViewHidden}
                  />
                )}
              </h2>
              <table>
                <thead>
                  <tr>
                    <th className="m-late-view__hide-check-header" />
                    <th className="m-late-view__scheduled-logon-header">
                      Scheduled Logon
                    </th>
                    <th className="m-late-view__route-header">Route</th>
                    <th className="m-late-view__run-number-header">Run</th>
                    <th className="m-late-view__location-header">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {missingLogons.map((missingLogon) => (
                    <MissingLogonRow
                      ghost={missingLogon}
                      key={missingLogon.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="m-late-view__panel m-late-view__late-buses">
              <h2 className="m-late-view__panel-header m-late-view__late-buses-panel-header">
                Late buses{" "}
                {anyRowsHidden && (
                  <UnhideToggle
                    viewHidden={viewHidden}
                    toggleViewHidden={toggleViewHidden}
                  />
                )}
              </h2>
              <table>
                <thead>
                  <tr>
                    <th className="m-late-view__adherence-header">Adherence</th>
                    <th className="m-late-view__route-header">Route</th>
                    <th className="m-late-view__vehicle-header">Vehicle</th>
                    <th className="m-late-view__run-number-header m-late-view__run-number-header--late">
                      Run
                    </th>
                    <th className="m-late-view__operator-header">Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {lateGhosts.map((lateGhost) => (
                    <LateGhostRow
                      ghost={lateGhost}
                      key={lateGhost.id}
                      dispatch={dispatch}
                    />
                  ))}
                  {lateBuses.map((lateBus) => (
                    <LateBusRow
                      vehicle={lateBus}
                      key={lateBus.id}
                      dispatch={dispatch}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DrawerTab
            isVisible={true}
            toggleVisibility={() => dispatch(toggleLateView())}
          />
        </div>
        {anyRowsSelected && (
          <HidePopup
            nRowsSelected={nRowsSelected}
            hideSelectedRows={hideSelectedRows}
          />
        )}
        {!anyRowsSelected && anyRecentlyHidden && (
          <UnhidePopup
            nRecentlyHidden={nRecentlyHidden}
            unhideRecentlyHidden={unhideRecentlyHidden}
            clearRecentlyHidden={clearRecentlyHidden}
          />
        )}
      </div>
    </LateViewContext.Provider>
  )
}

const LateGhostRow = ({
  ghost,
  dispatch,
}: {
  ghost: Ghost
  dispatch: Dispatch<Action>
}): ReactElement<HTMLElement> => {
  const routes = useContext(RoutesContext)

  return (
    <tr>
      <td>
        <HideCheckbox vehicleOrGhost={ghost} />
      </td>
      <td className="m-late-view__adherence-cell">N/A</td>
      <td>
        <span className="m-late-view__route-pill">
          {routeNameOrId(ghost.routeId, routes)}
        </span>
      </td>
      <td />
      <td className="m-late-view__run-number-cell m-late-view__run-number-cell--late">
        <a
          className="m-late-view__run-link"
          onClick={() => {
            if (window.FS) {
              window.FS.event("User selected late view run number - ghost bus")
            }
            dispatch(selectVehicle(ghost))
          }}
        >
          {ghost.blockWaivers.length > 0
            ? lateViewGhostWithWaiverIcon(
                "m-late-view__run-icon m-late-view__ghost-icon"
              )
            : lateViewGhostIcon(
                "m-late-view__run-icon m-late-view__ghost-icon"
              )}
          {runIdToLabel(ghost.runId)}
        </a>
      </td>
      <td />
    </tr>
  )
}

const LateBusRow = ({
  vehicle,
  dispatch,
}: {
  vehicle: Vehicle
  dispatch: Dispatch<Action>
}): ReactElement<HTMLElement> => {
  const routes = useContext(RoutesContext)

  return (
    <tr>
      <td>
        <HideCheckbox vehicleOrGhost={vehicle} />
      </td>
      <td className="m-late-view__adherence-cell">
        {secondsToMinutes(vehicle.scheduleAdherenceSecs) * -1}
      </td>
      <td>
        <span className="m-late-view__route-pill">
          {routeNameOrId(vehicle.routeId, routes)}
        </span>
      </td>
      <td>{vehicle.label}</td>
      <td className="m-late-view__run-number-cell m-late-view__run-number-cell--late">
        <a
          className="m-late-view__run-link"
          onClick={() => {
            if (window.FS) {
              window.FS.event("User selected late view run number")
            }
            dispatch(selectVehicle(vehicle))
          }}
        >
          {vehicle.blockWaivers.length > 0
            ? bangIcon("m-late-view__run-icon m-late-view__block-waiver-icon")
            : upRightIcon("m-late-view__run-icon m-late-view__up-right-icon")}
          {runIdToLabel(vehicle.runId)}
        </a>
      </td>
      <td>
        {vehicle.operatorLastName} &ndash; {vehicle.operatorId}
      </td>
    </tr>
  )
}

const MissingLogonRow = ({
  ghost,
}: {
  ghost: Ghost
}): ReactElement<HTMLElement> => {
  const routes = useContext(RoutesContext)

  return (
    <tr>
      <td>
        <HideCheckbox vehicleOrGhost={ghost} />
      </td>
      <td>
        {ghost.scheduledLogonTime
          ? formattedTime(dateFromEpochSeconds(ghost.scheduledLogonTime))
          : ""}
      </td>
      <td>
        <span className="m-late-view__route-pill">
          {routeNameOrId(ghost.currentPieceFirstRoute, routes)}
        </span>
      </td>
      <td>{runIdToLabel(ghost.runId)}</td>
      <td>{ghost.currentPieceStartPlace}</td>
    </tr>
  )
}

const HideCheckbox = ({
  vehicleOrGhost,
}: {
  vehicleOrGhost: VehicleOrGhost
}): ReactElement<HTMLElement> | null => {
  const { selectedIds, toggleCheckedState } = useContext(LateViewContext)
  const isChecked = idIn(vehicleOrGhost.id, selectedIds)

  return vehicleOrGhost.runId ? (
    <input
      type="checkbox"
      defaultChecked={isChecked}
      onClick={() => toggleCheckedState(vehicleOrGhost.runId!)}
    />
  ) : null
}

const HidePopup = ({
  nRowsSelected,
  hideSelectedRows,
}: {
  nRowsSelected: number
  hideSelectedRows: () => void
}) => (
  <div>
    {nRowsSelected} selected
    <button onClick={hideSelectedRows}>Hide</button>
  </div>
)

const UnhidePopup = ({
  nRecentlyHidden,
  unhideRecentlyHidden,
  clearRecentlyHidden,
}: {
  nRecentlyHidden: number
  unhideRecentlyHidden: () => void
  clearRecentlyHidden: () => void
}): ReactElement<HTMLElement> => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeOnClickOutside = (event: MouseEvent) => {
      if (ref && ref.current && !event.composedPath().includes(ref.current)) {
        clearRecentlyHidden()
      }
    }
    document.addEventListener("mousedown", closeOnClickOutside)
    return () => document.removeEventListener("mousedown", closeOnClickOutside)
  }, [ref])

  return (
    <div ref={ref}>
      {nRecentlyHidden} hidden
      <button onClick={unhideRecentlyHidden}>Undo</button>
    </div>
  )
}

const UnhideToggle = ({
  viewHidden,
  toggleViewHidden,
}: {
  viewHidden: boolean
  toggleViewHidden: () => void
}): ReactElement<HTMLElement> => (
  <button onClick={toggleViewHidden}>{viewHidden ? "Hide" : "Show"}</button>
)
export default LateView
