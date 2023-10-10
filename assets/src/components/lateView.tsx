import React, {
  Dispatch,
  ReactElement,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import RoutesContext from "../contexts/routesContext"
import { VehiclesByRouteIdContext } from "../contexts/vehiclesByRouteIdContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import {
  BangIcon,
  HiddenIcon,
  LateViewGhostIcon,
  LateViewGhostWithWaiverIcon,
  UnhiddenIcon,
  UpRightIcon,
} from "../helpers/icon"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import useInterval from "../hooks/useInterval"
import { flatten, uniqBy } from "../helpers/array"
import { saveState, loadState } from "../localStorage"
import { isVehicleInScheduledService, isGhost } from "../models/vehicle"
import { VehicleInScheduledService, Ghost, RunId } from "../realtime"
import {
  Action,
  closeView,
  returnToPreviousView,
  selectVehicle,
} from "../state"
import {
  secondsToMinutes,
  formattedTime,
  dateFromEpochSeconds,
} from "../util/dateTime"
import { runIdToLabel } from "../helpers/vehicleLabel"
import { routeNameOrId } from "../util/route"
import { tagManagerEvent } from "../helpers/googleTagManager"
import ViewHeader from "./viewHeader"
import { fullStoryEvent } from "../helpers/fullStory"

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

type HidingTimestamps = {
  [id: string]: number
}

type SelectionState = "none" | "some" | "all"

const isSelected = (
  selectedIds: RunId[],
  vehicleOrGhost: VehicleInScheduledService | Ghost
): boolean => {
  return !!(vehicleOrGhost.runId && selectedIds.includes(vehicleOrGhost.runId))
}

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
  //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return runIdToLabel(a.runId!).localeCompare(runIdToLabel(b.runId!))
}

const toggleRunIdInSet = (
  runId: RunId,
  runIds: RunId[],
  updateFunction: Dispatch<SetStateAction<RunId[]>>
): void => {
  if (runIds.includes(runId)) {
    updateFunction(runIds.filter((runIdToCompare) => runIdToCompare !== runId))
  } else {
    updateFunction([...runIds, runId])
  }
}

const readTimestampsFromLocalStorage = (): {
  hidingTimestamps: HidingTimestamps
  permanentHidingTimestamps: HidingTimestamps
} => {
  const storedTimestamps: {
    hidingTimestamps?: HidingTimestamps
    permanentHidingTimestamps?: HidingTimestamps
  } = loadState(storedStateKey) || {}
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
  const [{ mobileMenuIsOpen, previousView }, dispatch] =
    useContext(StateDispatchContext)
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

  const vehiclesByRouteId = useContext(VehiclesByRouteIdContext)

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
    .filter(isVehicleInScheduledService)
    .filter(
      (vehicle) =>
        vehicle.scheduleAdherenceSecs !== null &&
        vehicle.scheduleAdherenceSecs >= lateBusThreshold
    )
    .sort(
      (a, b) => (b.scheduleAdherenceSecs || 0) - (a.scheduleAdherenceSecs || 0)
    )

  const lateVehiclesAndGhosts = [...lateGhosts, ...lateBuses]

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""

  return (
    <div className={`c-late-view ${mobileMenuClass}`}>
      <div className="c-late-view__content-wrapper">
        <ViewHeader
          title="Late View"
          closeView={() => dispatch(closeView())}
          backlinkToView={previousView}
          followBacklink={() => dispatch(returnToPreviousView())}
        />
        <div className="c-late-view__panels">
          <div className="c-late-view__panel c-late-view__missing-logons">
            <h2 className="c-late-view__panel-header c-late-view__missing-logons-panel-header">
              Missing logons
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
                  <th className="c-late-view__hide-check-header">
                    <MasterCheckbox
                      attachedVehiclesOrGhosts={missingLogons}
                      selectedIds={selectedIds}
                      setSelectedIds={setSelectedIds}
                      hidingTimestamps={hidingTimestamps}
                      tableName="missing-logons"
                    />
                  </th>
                  <th className="c-late-view__scheduled-logon-header">
                    Scheduled Logon
                  </th>
                  <th className="c-late-view__route-header">Route</th>
                  <th className="c-late-view__run-number-header">Run</th>
                  <th className="c-late-view__location-header">Location</th>
                </tr>
              </thead>
              <tbody>
                {missingLogons.map((missingLogon) => (
                  <MissingLogonRow
                    ghost={missingLogon}
                    key={missingLogon.id}
                    selectedIds={selectedIds}
                    hidingTimestamps={hidingTimestamps}
                    toggleCheckedState={toggleCheckedState}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="c-late-view__panel c-late-view__late-buses">
            <h2 className="c-late-view__panel-header c-late-view__late-buses-panel-header">
              Late buses
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
                  <th className="c-late-view__hide-check-header">
                    <MasterCheckbox
                      attachedVehiclesOrGhosts={lateVehiclesAndGhosts}
                      selectedIds={selectedIds}
                      setSelectedIds={setSelectedIds}
                      hidingTimestamps={hidingTimestamps}
                      tableName="late-buses"
                    />
                  </th>
                  <th className="c-late-view__adherence-header">Adherence</th>
                  <th className="c-late-view__route-header">Route</th>
                  <th className="c-late-view__vehicle-header">Vehicle</th>
                  <th className="c-late-view__run-number-header c-late-view__run-number-header--late">
                    Run
                  </th>
                  <th className="c-late-view__operator-header">Driver</th>
                </tr>
              </thead>
              <tbody>
                {lateGhosts.map((lateGhost) => (
                  <LateGhostRow
                    ghost={lateGhost}
                    key={lateGhost.id}
                    selectedIds={selectedIds}
                    hidingTimestamps={hidingTimestamps}
                    toggleCheckedState={toggleCheckedState}
                    dispatch={dispatch}
                  />
                ))}
                {lateBuses.map((lateBus) => (
                  <LateBusRow
                    vehicle={lateBus}
                    key={lateBus.id}
                    selectedIds={selectedIds}
                    hidingTimestamps={hidingTimestamps}
                    toggleCheckedState={toggleCheckedState}
                    dispatch={dispatch}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {anyRowsSelected && (
        <HidePopup
          nRowsSelected={nRowsSelected}
          hideSelectedRows={hideSelectedRows}
          clearViewHidden={() => setViewHidden(false)}
        />
      )}
      {!anyRowsSelected && anyRecentlyHidden && (
        <UnhidePopup
          nRecentlyHidden={nRecentlyHidden}
          unhideRecentlyHidden={unhideRecentlyHidden}
        />
      )}
    </div>
  )
}

const LateGhostRow = ({
  ghost,
  dispatch,
  selectedIds,
  hidingTimestamps,
  toggleCheckedState,
}: {
  ghost: Ghost
  dispatch: Dispatch<Action>
  hidingTimestamps: HidingTimestamps
  selectedIds: RunId[]
  toggleCheckedState: (runId: RunId) => void
}): ReactElement<HTMLElement> => {
  const routes = useContext(RoutesContext)
  const className = isSelected(selectedIds, ghost)
    ? "c-late-view__data-row--selected"
    : "c-late-view__data-row--unselected"

  return (
    <tr className={`c-late-view__data-row ${className}`} data-testid="row-data">
      <td>
        <HideCheckbox
          hidingTimestamps={hidingTimestamps}
          selectedIds={selectedIds}
          vehicleOrGhost={ghost}
          toggleCheckedState={toggleCheckedState}
        />
      </td>
      <td className="c-late-view__adherence-cell">N/A</td>
      <td>
        <span className="c-late-view__route-pill">
          {routeNameOrId(ghost.routeId, routes)}
        </span>
      </td>
      <td />
      <td className="c-late-view__run-number-cell c-late-view__run-number-cell--late">
        <button
          className="c-late-view__run-link"
          onClick={() => {
            tagManagerEvent("selected_late_view_run_number_ghost")
            fullStoryEvent("User clicked Late View Run Number", {
              isGhost_bool: true,
            })

            dispatch(selectVehicle(ghost))
          }}
        >
          {ghost.blockWaivers.length > 0 ? (
            <LateViewGhostWithWaiverIcon className="c-late-view__run-icon c-late-view__ghost-icon" />
          ) : (
            <LateViewGhostIcon className="c-late-view__run-icon c-late-view__ghost-icon" />
          )}
          {runIdToLabel(ghost.runId)}
        </button>
      </td>
      <td />
    </tr>
  )
}

const LateBusRow = ({
  vehicle,
  dispatch,
  selectedIds,
  hidingTimestamps,
  toggleCheckedState,
}: {
  vehicle: VehicleInScheduledService
  dispatch: Dispatch<Action>
  selectedIds: RunId[]
  hidingTimestamps: HidingTimestamps
  toggleCheckedState: (runId: RunId) => void
}): ReactElement<HTMLElement> => {
  const routes = useContext(RoutesContext)

  const className = isSelected(selectedIds, vehicle)
    ? "c-late-view__data-row--selected"
    : "c-late-view__data-row--unselected"

  return (
    <tr className={`c-late-view__data-row ${className}`} data-testid="row-data">
      <td>
        <HideCheckbox
          vehicleOrGhost={vehicle}
          selectedIds={selectedIds}
          hidingTimestamps={hidingTimestamps}
          toggleCheckedState={toggleCheckedState}
        />
      </td>
      <td className="c-late-view__adherence-cell">
        {secondsToMinutes(vehicle.scheduleAdherenceSecs || 0) * -1}
      </td>
      <td>
        <span className="c-late-view__route-pill">
          {routeNameOrId(vehicle.routeId, routes)}
        </span>
      </td>
      <td>{vehicle.label}</td>
      <td className="c-late-view__run-number-cell c-late-view__run-number-cell--late">
        <button
          className="c-late-view__run-link"
          onClick={() => {
            tagManagerEvent("selected_late_view_run_number")
            fullStoryEvent("User clicked Late View Run Number", {
              isGhost_bool: false,
            })
            dispatch(selectVehicle(vehicle))
          }}
        >
          {vehicle.blockWaivers.length > 0 ? (
            <BangIcon className="c-late-view__run-icon c-late-view__block-waiver-icon" />
          ) : (
            <UpRightIcon className="c-late-view__run-icon c-late-view__up-right-icon" />
          )}
          {runIdToLabel(vehicle.runId)}
        </button>
      </td>
      <td className="c-late-view__operator-name fs-mask">
        {vehicle.operatorLastName} &ndash; {vehicle.operatorId}
      </td>
    </tr>
  )
}

const MissingLogonRow = ({
  ghost,
  selectedIds,
  hidingTimestamps,
  toggleCheckedState,
}: {
  ghost: Ghost
  selectedIds: RunId[]
  hidingTimestamps: HidingTimestamps
  toggleCheckedState: (runId: RunId) => void
}): ReactElement<HTMLElement> => {
  const routes = useContext(RoutesContext)

  const className = isSelected(selectedIds, ghost)
    ? "c-late-view__data-row--selected"
    : "c-late-view__data-row--unselected"

  return (
    <tr className={`c-late-view__data-row ${className}`} data-testid="row-data">
      <td>
        <HideCheckbox
          vehicleOrGhost={ghost}
          selectedIds={selectedIds}
          hidingTimestamps={hidingTimestamps}
          toggleCheckedState={toggleCheckedState}
        />
      </td>
      <td>
        {ghost.scheduledLogonTime
          ? formattedTime(dateFromEpochSeconds(ghost.scheduledLogonTime))
          : ""}
      </td>
      <td>
        <span className="c-late-view__route-pill">
          {routeNameOrId(ghost.currentPieceFirstRoute, routes)}
        </span>
      </td>
      <td>{runIdToLabel(ghost.runId)}</td>
      <td>{ghost.currentPieceStartPlace}</td>
    </tr>
  )
}

const HideCheckbox = ({
  hidingTimestamps,
  selectedIds,
  toggleCheckedState,
  vehicleOrGhost,
}: {
  hidingTimestamps: HidingTimestamps
  selectedIds: RunId[]
  toggleCheckedState: (runId: RunId) => void
  vehicleOrGhost: VehicleInScheduledService | Ghost
}): ReactElement<HTMLElement> | null => {
  const runId = vehicleOrGhost.runId

  if (!runId) {
    return null
  }

  if (hidingTimestamps[runId]) {
    return null
  }

  const isChecked = isSelected(selectedIds, vehicleOrGhost)
  return (
    <input
      type="checkbox"
      data-testid={`row-checkbox-${runId}`}
      readOnly={true}
      checked={isChecked}
      onClick={() => toggleCheckedState(runId)}
    />
  )
}

const HidePopup = ({
  nRowsSelected,
  hideSelectedRows,
  clearViewHidden,
}: {
  nRowsSelected: number
  hideSelectedRows: () => void
  clearViewHidden: () => void
}) => {
  const onclickCallback = () => {
    hideSelectedRows()
    clearViewHidden()
  }

  return (
    <div className="c-late-view__popup c-late-view__hide-popup">
      {nRowsSelected} selected
      <button onClick={onclickCallback}>{<HiddenIcon />} Hide</button>
    </div>
  )
}

const UnhidePopup = ({
  nRecentlyHidden,
  unhideRecentlyHidden,
}: {
  nRecentlyHidden: number
  unhideRecentlyHidden: () => void
}): ReactElement<HTMLElement> => (
  <div className="c-late-view__popup c-late-view__unhide-popup">
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
    className={`c-late-view__hide-toggle c-late-view__hide-toggle--${
      viewHidden ? "unhidden" : "hidden"
    }`}
    onClick={() => {
      tagManagerEvent("clicked_eye_toggle")
      fullStoryEvent('User clicked the "hide" eye toggle')
      toggleViewHidden()
    }}
    title={viewHidden ? "Exclude Hidden" : "Include Hidden"}
  >
    {viewHidden ? <UnhiddenIcon /> : <HiddenIcon />}
    <div className="c-late-view__toggle-exterior">
      <div className="c-late-view__toggle-interior" />
    </div>
  </button>
)

const MasterCheckbox = ({
  attachedVehiclesOrGhosts,
  selectedIds,
  setSelectedIds,
  hidingTimestamps,
  tableName,
}: {
  attachedVehiclesOrGhosts: (VehicleInScheduledService | Ghost)[]
  selectedIds: RunId[]
  setSelectedIds: Dispatch<SetStateAction<RunId[]>>
  hidingTimestamps: HidingTimestamps
  tableName: string
}): ReactElement<HTMLElement> => {
  const attachedIds = attachedVehiclesOrGhosts
    .map((attachedVehicleOrGhost) => attachedVehicleOrGhost.runId)
    .filter((id) => id && !hidingTimestamps[id]) as RunId[]

  const hiddenAttachedIds = attachedIds.filter((id) => hidingTimestamps[id])
  const selectedAttachedIds = selectedIds.filter(
    (id) => attachedIds.includes(id) && !hiddenAttachedIds.includes(id)
  )

  const selectionState: SelectionState =
    selectedAttachedIds.length === 0
      ? "none"
      : selectedAttachedIds.length + hiddenAttachedIds.length ===
        attachedIds.length
      ? "all"
      : "some"

  const toggleRows =
    selectionState === "all"
      ? () =>
          setSelectedIds(
            selectedIds.filter(
              (selectedId) =>
                !attachedIds.includes(selectedId) &&
                !hiddenAttachedIds.includes(selectedId)
            )
          )
      : () =>
          setSelectedIds(Array.from(new Set(attachedIds.concat(selectedIds))))

  const checkRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (checkRef.current) {
      checkRef.current.checked = selectionState === "all"
      checkRef.current.indeterminate = selectionState === "some"
    }
  }, [selectionState])

  return (
    <input
      type="checkbox"
      className={`c-late-view__master-checkbox`}
      data-testid={`${tableName}-master-checkbox`}
      readOnly={true}
      onClick={toggleRows}
      ref={checkRef}
    />
  )
}

export default LateView
