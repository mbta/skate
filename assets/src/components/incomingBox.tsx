import React, { useContext } from "react"
import DispatchContext from "../contexts/dispatchContext"
import { Vehicle, VehicleId } from "../skate"
import { selectVehicle } from "../state"
import {
  LadderDirection,
  VehicleDirection,
  vehicleDirectionOnLadder,
} from "./ladder"
import VehicleIcon from "./vehicleIcon"

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
  const isSelected = vehicle.id === selectedVehicleId
  const rotation =
    vehicleDirectionOnLadder(vehicle, ladderDirection) === VehicleDirection.Down
      ? 180
      : 0

  return (
    <div
      className="m-incoming-box__vehicle"
      onClick={() => dispatch(selectVehicle(vehicle.id))}
    >
      <div className="m-incoming-box__vehicle-icon">
        <svg className="m-incoming-box__vehicle-icon-svg">
          <g transform={`rotate(${rotation},9,7)`}>
            <VehicleIcon isSelected={isSelected} scale={0.38} />
          </g>
        </svg>
      </div>
      <div className="m-incoming-box__vehicle-label">{vehicle.label}</div>
    </div>
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
