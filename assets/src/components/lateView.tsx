import React, {
  Dispatch,
  ReactElement,
  createContext,
  SetStateAction,
  useContext,
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
import useInterval from "../hooks/useInterval"
import { flatten, uniqBy } from "../helpers/array"
import { saveState, loadState } from "../localStorage"
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

// all these times are in seconds
const unhidePopupVisibilityPeriod = 5
const cleanupInterval = 10
// 15 minutes
const lateBusThreshold = 60 * 15
// 45 minutes
const missingLogonThreshold = 60 * 45
const permanentlyHideThreshold = 60 * 45
// 8 hours
const permanentlyHiddenCleanupThreshold = 8 * 60 * 60

const storedStateKey = "mbta-skate-lateview-state"

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
  removeFrom.filter((idInList) => idInList !== toRemove)

type HidingTimestamps = {
  [id: string]: number
}

const toggleRunIdInSet = (
  runId: RunId,
  runIds: RunId[],
  updateFunction: Dispatch<SetStateAction<RunId[]>>
): void => {
  if (idIn(runId, runIds)) {
    updateFunction(remove(runIds, runId))
  } else {
    updateFunction([...runIds, runId])
  }
}

// tslint:disable: no-empty
const LateViewContext = createContext<{
  selectedIds: RunId[]
  toggleCheckedState: (selectedId: RunId) => void
  setSelectedIds: Dispatch<SetStateAction<RunId[]>>
}>({
  selectedIds: [],
  toggleCheckedState: () => {},
  setSelectedIds: () => {},
})
// tslint:enable: no-empty

const readTimestampsFromLocalStorage = (): {
  hidingTimestamps: HidingTimestamps
  permanentHidingTimestamps: HidingTimestamps
} => {
  const storedTimestamps: {
    hidingTimestamps?: HidingTimestamps
    permanentHidingTimestamps?: HidingTimestamps
  } = loadState(storedStateKey) ? {} : {}
  const hidingTimestamps = storedTimestamps.hidingTimestamps || {}
  const permanentHidingTimestamps =
    storedTimestamps.permanentHidingTimestamps || {}
  return { hidingTimestamps, permanentHidingTimestamps }
}

const saveTimestampsToLocalStorage = (timestamps: {
  hidingTimestamps: HidingTimestamps
  permanentHidingTimestamps: HidingTimestamps
}): void => saveState(storedStateKey, timestamps)

const LateView = (): ReactElement<HTMLElement> => {
  const [, dispatch] = useContext(StateDispatchContext)
  const currentTimeSeconds = useCurrentTimeSeconds()
  const currentTimeMillis = currentTimeSeconds * 1000

  // This is getting to be a lot of state and a lot of interactions. In the
  // likely case that we add more functionality to this view, we might
  // want to refactor to use a reducer.

  const [recentlyHiddenIds, setRecentlyHiddenIds] = useState<RunId[]>([])
  const loadedTimestamps = readTimestampsFromLocalStorage()
  const [hidingTimestamps, setHidingTimestamps] = useState<HidingTimestamps>(
    loadedTimestamps.hidingTimestamps
  )
  const [permanentHidingTimestamps, setPermanentHidingTimestamps] =
    useState<HidingTimestamps>(loadedTimestamps.permanentHidingTimestamps)

  const [selectedIds, setSelectedIds] = useState<RunId[]>([])
  const [viewHidden, setViewHidden] = useState<boolean>(false)
  const [unhideTimeout, setUnhideTimeout] = useState<number | undefined>(
    undefined
  )

  const toggleCheckedState = (id: RunId): void => {
    toggleRunIdInSet(id, selectedIds, setSelectedIds)
  }

  const hideSelectedRows: () => void = () => {
    setRecentlyHiddenIds(selectedIds)
    setSelectedIds([])
    const newHidingTimestamps = selectedIds.reduce(
      (result, id) => ({ ...result, [id]: currentTimeMillis }),
      hidingTimestamps
    )
    setHidingTimestamps(newHidingTimestamps)

    saveTimestampsToLocalStorage({
      hidingTimestamps: newHidingTimestamps,
      permanentHidingTimestamps,
    })

    if (unhideTimeout) {
      window.clearTimeout(unhideTimeout)
    }
    const newUnhideTimeout = window.setTimeout(() => {
      setRecentlyHiddenIds([])
      setUnhideTimeout(undefined)
    }, unhidePopupVisibilityPeriod * 1000)

    setUnhideTimeout(newUnhideTimeout)
  }

  const unhideRecentlyHidden: () => void = () => {
    setHidingTimestamps(
      recentlyHiddenIds.reduce((result, id) => {
        const { [id]: _, ...rest } = result
        return rest
      }, hidingTimestamps)
    )
    setRecentlyHiddenIds([])
    if (unhideTimeout) {
      window.clearTimeout(unhideTimeout)
      setUnhideTimeout(undefined)
    }
  }

  const toggleViewHidden: () => void = () => setViewHidden(!viewHidden)

  const permanentlyHideOldHiddenIds: () => void = () => {
    const oldHiddenIds = Object.keys(hidingTimestamps).filter(
      (runId) =>
        hidingTimestamps[runId] + permanentlyHideThreshold * 1000 < Date.now()
    )
    const newHidingTimestamps = oldHiddenIds.reduce((result, id) => {
      const { [id]: _, ...rest } = result
      return rest
    }, hidingTimestamps)
    const newPermanentHidingTimestamps = oldHiddenIds.reduce(
      (result, id) => ({ ...result, [id]: Date.now() }),
      permanentHidingTimestamps
    )
    setHidingTimestamps(newHidingTimestamps)
    setPermanentHidingTimestamps(newPermanentHidingTimestamps)
    saveTimestampsToLocalStorage({
      hidingTimestamps: newHidingTimestamps,
      permanentHidingTimestamps: newPermanentHidingTimestamps,
    })
  }

  const cleanUpPermanentlyHiddenIds: () => void = () => {
    const oldPermanentlyHiddenIds = Object.keys(
      permanentHidingTimestamps
    ).filter(
      (runId) =>
        permanentHidingTimestamps[runId] +
          permanentlyHiddenCleanupThreshold * 1000 <
        Date.now()
    )
    const newPermanentHidingTimestamps = oldPermanentlyHiddenIds.reduce(
      (result, id) => {
        const { [id]: _, ...rest } = result
        return rest
      },
      permanentHidingTimestamps
    )
    setPermanentHidingTimestamps(newPermanentHidingTimestamps)
    saveTimestampsToLocalStorage({
      hidingTimestamps,
      permanentHidingTimestamps: newPermanentHidingTimestamps,
    })
  }

  useInterval(() => {
    permanentlyHideOldHiddenIds()
    cleanUpPermanentlyHiddenIds()
  }, cleanupInterval * 1000)

  const nRowsSelected = selectedIds.length
  const anyRowsSelected = nRowsSelected > 0

  const nRecentlyHidden = recentlyHiddenIds.length
  const anyRecentlyHidden = nRecentlyHidden > 0

  const anyRowsHidden = Object.keys(hidingTimestamps).length > 0

  const vehiclesByRouteId: ByRouteId<VehicleOrGhost[]> = useContext(
    VehiclesByRouteIdContext
  )

  const vehiclesOrGhosts = uniqBy(
    flatten(Object.values(vehiclesByRouteId)),
    (vehicleOrGhost) => vehicleOrGhost.runId
  ).filter((vehicleOrGhost) => {
    return (
      vehicleOrGhost.runId &&
      !permanentHidingTimestamps[vehicleOrGhost.runId] &&
      (viewHidden || !hidingTimestamps[vehicleOrGhost.runId])
    )
  })

  const withinMissingLogonThreshold = (ghost: Ghost) =>
    currentTimeSeconds - (ghost.scheduledLogonTime as number) <=
    missingLogonThreshold

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

  const lateVehiclesAndGhosts = (lateGhosts as VehicleOrGhost[]).concat(
    lateBuses
  )

  return (
    <LateViewContext.Provider
      value={{ selectedIds, setSelectedIds, toggleCheckedState }}
    >
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
                    <th className="m-late-view__hide-check-header">
                      <MasterCheckbox
                        attachedIds={
                          missingLogons
                            .map((x) => x.runId)
                            .filter((x) => x) as RunId[]
                        }
                      />
                    </th>
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
                    <th className="m-late-view__hide-check-header">
                      <MasterCheckbox
                        attachedIds={
                          lateVehiclesAndGhosts
                            .map((x) => x.runId)
                            .filter((x) => x) as RunId[]
                        }
                      />
                    </th>
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
  const isChecked = vehicleOrGhost.runId
    ? idIn(vehicleOrGhost.runId, selectedIds)
    : false

  return vehicleOrGhost.runId ? (
    <input
      type="checkbox"
      checked={isChecked}
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
}: {
  nRecentlyHidden: number
  unhideRecentlyHidden: () => void
}): ReactElement<HTMLElement> => (
  <div>
    {nRecentlyHidden} hidden
    <button onClick={unhideRecentlyHidden}>Undo</button>
  </div>
)

const UnhideToggle = ({
  viewHidden,
  toggleViewHidden,
}: {
  viewHidden: boolean
  toggleViewHidden: () => void
}): ReactElement<HTMLElement> => (
  <button
    onClick={() => {
      if (window && window.FS) {
        window.FS.event("User clicked eye toggle")
      }
      toggleViewHidden()
    }}
  >
    {viewHidden ? "Hide" : "Show"}
  </button>
)

const MasterCheckbox = ({
  attachedIds,
}: {
  attachedIds: RunId[]
}): ReactElement<HTMLElement> => {
  const { selectedIds, setSelectedIds } = useContext(LateViewContext)

  const selectedAttachedIds = selectedIds.filter((id) =>
    attachedIds.includes(id)
  )
  const selectionState =
    selectedAttachedIds.length === 0
      ? "none"
      : selectedAttachedIds.length === attachedIds.length
      ? "all"
      : "some"

  const toggleRows =
    selectionState === "all"
      ? () =>
          setSelectedIds(
            selectedIds.filter((selectedId) => !idIn(selectedId, attachedIds))
          )
      : () =>
          setSelectedIds(Array.from(new Set(attachedIds.concat(selectedIds))))

  return (
    <input
      type="checkbox"
      className={`m-late-view__master-checkbox m-late-view__master-checkbox--${selectionState}-selected`}
      checked={selectionState === "all"}
      onClick={toggleRows}
    />
  )
}

export default LateView
