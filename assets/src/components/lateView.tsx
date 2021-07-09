import React, { Dispatch, ReactElement, useContext } from "react"
import DrawerTab from "../components/drawerTab"
import RoutesContext from "../contexts/routesContext"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { upRightIcon } from "../helpers/icon"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import useVehicles from "../hooks/useVehicles"
import { flatten } from "../helpers/array"
import { isVehicle, isGhost } from "../models/vehicle"
import { Vehicle, Ghost } from "../realtime"
import { Action, selectVehicle, toggleLateView } from "../state"
import {
  secondsToMinutes,
  formattedTime,
  dateFromEpochSeconds,
} from "../util/dateTime"
import { runIdToLabel } from "../helpers/vehicleLabel"
import { routeNameOrId } from "../util/route"

const LateView = (): ReactElement<HTMLElement> => {
  const [{ selectedRouteIds }, dispatch] = useContext(StateDispatchContext)
  const { socket } = useContext(SocketContext)

  const vehiclesByRouteId = useVehicles(socket, selectedRouteIds)

  const vehiclesOrGhosts = flatten(Object.values(vehiclesByRouteId))

  const lateBusThreshold = 60 * 15
  const missingLogonThreshold = 60 * 45

  const currentTime = useCurrentTimeSeconds()

  const missingLogons = vehiclesOrGhosts
    .filter(isGhost)
    .filter((ghost) => ghost.scheduledLogonTime !== null)
    .filter(
      (ghost) =>
        currentTime - (ghost.scheduledLogonTime as number) <=
        missingLogonThreshold
    )
    .sort(
      (a, b) =>
        (a.scheduledLogonTime as number) - (b.scheduledLogonTime as number)
    )

  const lateBuses = vehiclesOrGhosts
    .filter(isVehicle)
    .filter((vehicle) => vehicle.routeStatus === "on_route")
    .filter((vehicle) => vehicle.scheduleAdherenceSecs >= lateBusThreshold)
    .sort((a, b) => b.scheduleAdherenceSecs - a.scheduleAdherenceSecs)

  return (
    <div className="m-late-view">
      <div className="m-late-view__title">Late View</div>
      <div className="m-late-view__panels">
        <div className="m-late-view__panel m-late-view__missing-logons">
          <h2 className="m-late-view__panel_header">Missing logons</h2>
          <table>
            <thead>
              <tr>
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
                <MissingLogonRow ghost={missingLogon} key={missingLogon.id} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="m-late-view__panel m-late-view__late-buses">
          <h2>Late buses</h2>
          <table>
            <thead>
              <tr>
                <th className="m-late-view__adherence-header">Adherence</th>
                <th className="m-late-view__route-header">Route</th>
                <th className="m-late-view__vehicle-header">Vehicle</th>
                <th className="m-late-view__run-number-header">Run</th>
                <th className="m-late-view__operator-header">Driver</th>
              </tr>
            </thead>
            <tbody>
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
      <td className="m-late-view__adherence-cell">
        {secondsToMinutes(vehicle.scheduleAdherenceSecs) * -1}
      </td>
      <td>
        <span className="m-late-view__route-pill">
          {routeNameOrId(vehicle.routeId, routes)}
        </span>
      </td>
      <td>{vehicle.label}</td>
      <td className="m-late-view__run-number-cell">
        <a onClick={() => dispatch(selectVehicle(vehicle))}>
          {upRightIcon("m-late-view__run-icon")}
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

export default LateView
