import React, { useContext } from "react"
import DispatchContext from "../contexts/dispatchContext"
import {
  VehicleDirection,
  vehicleDirectionOnLadder,
} from "../models/ladderVehicle"
import { Vehicle, VehicleId } from "../skate"
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
  const dispatch = useContext(DispatchContext)
  const selectedClass = vehicle.id === selectedVehicleId ? "selected" : ""
  const orientation =
    vehicleDirectionOnLadder(vehicle, ladderDirection) === VehicleDirection.Down
      ? Orientation.Down
      : Orientation.Up

  return (
    <button
      className={`m-incoming-box__vehicle ${
        vehicle.scheduleAdherenceStatus
      } ${selectedClass}`}
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
