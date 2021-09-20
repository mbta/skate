import React, {
  Dispatch,
  ReactElement,
  createContext,
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
import { flatten, uniqBy } from "../helpers/array"
import { isVehicle, isGhost } from "../models/vehicle"
import { Vehicle, Ghost, VehicleOrGhost, VehicleId } from "../realtime"
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

// JS does have a Set type, but its API uses mutable state in a way
// that makes it inconvenient for us to use here.
interface VehicleIdSet {
  [id: string]: boolean
}

// tslint:disable: no-empty
const LateViewContext = createContext<{
  selectedIds: VehicleIdSet
  toggleCheckedState: (selectedId: VehicleId) => void
}>({
  selectedIds: {},
  toggleCheckedState: () => {},
})

// tslint:enable: no-empty

const LateView = (): ReactElement<HTMLElement> => {
  const [, dispatch] = useContext(StateDispatchContext)

  const [selectedIds, setSelectedIds] = useState<VehicleIdSet>({})
  const toggleCheckedState = (checkedId: VehicleId): void => {
    if (selectedIds[checkedId]) {
      setSelectedIds({ ...selectedIds, [checkedId]: false })
    } else {
      setSelectedIds({ ...selectedIds, [checkedId]: true })
    }
  }

  const vehiclesByRouteId: ByRouteId<VehicleOrGhost[]> = useContext(
    VehiclesByRouteIdContext
  )

  const vehiclesOrGhosts = uniqBy(
    flatten(Object.values(vehiclesByRouteId)),
    (vehicleOrGhost) => vehicleOrGhost.runId
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
                Missing logons
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
                Late buses
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
}): ReactElement<HTMLElement> => {
  const { selectedIds, toggleCheckedState } = useContext(LateViewContext)
  const isChecked = !!selectedIds[vehicleOrGhost.id]

  return (
    <input
      type="checkbox"
      defaultChecked={isChecked}
      onClick={() => toggleCheckedState(vehicleOrGhost.id)}
    />
  )
}

export default LateView
