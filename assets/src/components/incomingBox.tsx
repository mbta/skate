import React, { useContext } from "react"
import StateDispatchContext from "../contexts/stateDispatchContext"
import vehicleAdherenceDisplayClass from "../helpers/vehicleAdherenceDisplayClass"
import { directionOnLadder, VehicleDirection } from "../models/ladderVehicle"
import { status } from "../models/vehicleStatus"
import { Vehicle, VehicleId } from "../realtime.d"
import { selectVehicle } from "../state"
import { LadderDirection } from "./ladder"
import VehicleIcon, { Orientation, Size } from "./vehicleIcon"

const IncomingBoxVehicle = ({
  vehicle,
  ladderDirection,
  selectedVehicleId,
}: {
  vehicle: Vehicle
  ladderDirection: LadderDirection
  selectedVehicleId: VehicleId | undefined
}) => {
  const [, dispatch] = useContext(StateDispatchContext)
  const selectedClass = vehicle.id === selectedVehicleId ? "selected" : ""
  const orientation =
    directionOnLadder(vehicle.directionId, ladderDirection) ===
    VehicleDirection.Down
      ? Orientation.Down
      : Orientation.Up

  return (
    <button
      className={`m-incoming-box__vehicle ${vehicleAdherenceDisplayClass(
        vehicle.headwaySpacing,
        status(vehicle)
      )} ${selectedClass}`}
      onClick={() => dispatch(selectVehicle(vehicle.id))}
    >
      <VehicleIcon
        size={Size.Small}
        orientation={orientation}
        variant={vehicle.viaVariant}
      />
      <div className="m-incoming-box__vehicle-label">{vehicle.label}</div>
    </button>
  )
}

const IncomingBox = ({
  vehicles,
  ladderDirection,
  selectedVehicleId,
}: {
  vehicles: Vehicle[]
  ladderDirection: LadderDirection
  selectedVehicleId: VehicleId | undefined
}) => (
  <div className="m-incoming-box">
    {vehicles.map(vehicle => (
      <IncomingBoxVehicle
        vehicle={vehicle}
        ladderDirection={ladderDirection}
        selectedVehicleId={selectedVehicleId}
        key={vehicle.id}
      />
    ))}
  </div>
)

export default IncomingBox
