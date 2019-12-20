import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import vehicleLabel from "../helpers/vehicleLabel"
import { directionOnLadder, VehicleDirection } from "../models/ladderVehicle"
import { drawnStatus } from "../models/vehicleStatus"
import { VehicleId, VehicleOrGhost } from "../realtime.d"
import { selectVehicle } from "../state"
import { LadderDirection } from "./ladder"
import VehicleIcon, { Orientation, Size } from "./vehicleIcon"

const IncomingBoxVehicle = ({
  vehicleOrGhost,
  ladderDirection,
  selectedVehicleId,
}: {
  vehicleOrGhost: VehicleOrGhost
  ladderDirection: LadderDirection
  selectedVehicleId: VehicleId | undefined
}) => {
  const [{ settings }, dispatch] = useContext(StateDispatchContext)
  const selectedClass =
    vehicleOrGhost.id === selectedVehicleId ? "selected" : ""
  const orientation =
    directionOnLadder(vehicleOrGhost.directionId, ladderDirection) ===
    VehicleDirection.Down
      ? Orientation.Down
      : Orientation.Up

  return (
    <button
      className={`m-incoming-box__vehicle ${selectedClass}`}
      onClick={() => dispatch(selectVehicle(vehicleOrGhost.id))}
    >
      <VehicleIcon
        size={Size.Small}
        orientation={orientation}
        variant={vehicleOrGhost.viaVariant}
        status={drawnStatus(vehicleOrGhost)}
      />
      <div className="m-incoming-box__vehicle-label">
        {vehicleLabel(vehicleOrGhost, settings)}
      </div>
    </button>
  )
}

const IncomingBox = ({
  vehiclesAndGhosts,
  ladderDirection,
  selectedVehicleId,
}: {
  vehiclesAndGhosts: VehicleOrGhost[]
  ladderDirection: LadderDirection
  selectedVehicleId: VehicleId | undefined
}) => (
  <div className="m-incoming-box">
    {vehiclesAndGhosts.map(vehicleOrGhost => (
      <IncomingBoxVehicle
        vehicleOrGhost={vehicleOrGhost}
        ladderDirection={ladderDirection}
        selectedVehicleId={selectedVehicleId}
        key={vehicleOrGhost.id}
      />
    ))}
  </div>
)

export default IncomingBox
