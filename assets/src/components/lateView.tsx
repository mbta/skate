import React, { ReactElement, useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import useVehicles from "../hooks/useVehicles"
import { flatten } from "../helpers/array"
import { isVehicle, isGhost } from "../models/vehicle"
import { Vehicle, Ghost } from "../realtime"
import {
  secondsToMinutes,
  formattedTime,
  dateFromEpochSeconds,
} from "../util/dateTime"
import { runIdToLabel } from "../helpers/vehicleLabel"

const LateView = (): ReactElement<HTMLElement> => {
  const [{ selectedRouteIds }] = useContext(StateDispatchContext)
  const { socket } = useContext(SocketContext)

  const vehiclesByRouteId = useVehicles(socket, selectedRouteIds)

  const vehiclesOrGhosts = flatten(Object.values(vehiclesByRouteId))

  const latenessThreshold = 60 * 15

  const currentTime = useCurrentTimeSeconds()

  const missingLogons = vehiclesOrGhosts
    .filter(isGhost)
    .filter((ghost) => ghost.scheduledLogonTime !== null)
    .filter(
      (ghost) =>
        currentTime - (ghost.scheduledLogonTime as number) <= latenessThreshold
    )
    .sort(
      (a, b) =>
        (a.scheduledLogonTime as number) - (b.scheduledLogonTime as number)
    )

  const lateBuses = vehiclesOrGhosts
    .filter(isVehicle)
    .filter((vehicle) => vehicle.routeStatus === "on_route")
    .filter((vehicle) => vehicle.scheduleAdherenceSecs >= latenessThreshold)
    .sort((a, b) => b.scheduleAdherenceSecs - a.scheduleAdherenceSecs)

  return (
    <div className="m-late-view">
      <div className="m-late-view__missing_logons" />
      <h2>Missing logons</h2>
      <table>
        <thead>
          <tr>
            <th>Scheduled Logon</th>
            <th>Route</th>
            <th>Run</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {missingLogons.map((missingLogon) => (
            <MissingLogonRow ghost={missingLogon} key={missingLogon.id} />
          ))}
        </tbody>
      </table>
      <div className="m-late-view__late_buses">
        <h2>Late buses</h2>
        <table>
          <thead>
            <tr>
              <th>Adherence</th>
              <th>Block waivers?</th>
              <th>Route</th>
              <th>Vehicle</th>
              <th>Run</th>
              <th>Driver</th>
            </tr>
          </thead>
          <tbody>
            {lateBuses.map((lateBus) => (
              <LateBusRow vehicle={lateBus} key={lateBus.id} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const LateBusRow = ({
  vehicle,
}: {
  vehicle: Vehicle
}): ReactElement<HTMLElement> => {
  // TODO: what kind of dash to use in operator column?
  return (
    <tr>
      <th>{secondsToMinutes(vehicle.scheduleAdherenceSecs) * -1}</th>
      <th>{vehicle.blockWaivers.length > 0 ? "Y" : "N"}</th>
      <th>{vehicle.routeId}</th>
      <th>{vehicle.label}</th>
      <th>{runIdToLabel(vehicle.runId)}</th>
      <th>
        {vehicle.operatorLastName} - {vehicle.operatorId}
      </th>
    </tr>
  )
}

const MissingLogonRow = ({
  ghost,
}: {
  ghost: Ghost
}): ReactElement<HTMLElement> => {
  return (
    <tr>
      <th>
        {ghost.scheduledLogonTime
          ? formattedTime(dateFromEpochSeconds(ghost.scheduledLogonTime))
          : ""}
      </th>
      <th>{ghost.currentPieceFirstRoute}</th>
      <th>{runIdToLabel(ghost.runId)}</th>
      <th>{ghost.currentPieceStartPlace}</th>
    </tr>
  )
}

export default LateView
