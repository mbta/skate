import React, { ReactElement, useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useVehicles from "../hooks/useVehicles"
import { flatten } from "../helpers/array"
import { isVehicle } from "../models/vehicle"
import { Vehicle } from "../realtime"
import { secondsToMinutes } from "../util/dateTime"
import { runIdToLabel } from "../helpers/vehicleLabel"

const LateView = (): ReactElement<HTMLElement> => {
  const [{ selectedRouteIds }] = useContext(StateDispatchContext)
  const { socket } = useContext(SocketContext)

  const vehiclesByRouteId = useVehicles(socket, selectedRouteIds)

  const vehiclesOrGhosts = flatten(Object.values(vehiclesByRouteId))

  // find late logons by looking for ghosts (for now)
  // how to determine when a ghost was supposed to log on?
  // Will probably need to pass that information from the back-end in a new field on ghost. The backend function that generates ghosts already has the schedule data.

  // const missingLogons = vehiclesOrGhosts
  //    .Filter(isGhost)

  const latenessThreshold = 60 * 15

  const lateBuses = vehiclesOrGhosts
    .filter(isVehicle)
    .filter((vehicle) => vehicle.routeStatus === "on_route")
    .filter((vehicle) => vehicle.scheduleAdherenceSecs >= latenessThreshold)
    .sort((a, b) => b.scheduleAdherenceSecs - a.scheduleAdherenceSecs)

  return (
    <div className="m-late-view">
      <div className="m-late-view__late_logons" />
      <div className="m-late-view__late_buses">
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

export default LateView
