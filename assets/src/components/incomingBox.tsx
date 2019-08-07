import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { useTripContext } from "../contexts/tripsByIdContext"
import runIdToLabel from "../helpers/runIdToLabel"
import vehicleAdherenceDisplayClass from "../helpers/vehicleAdherenceDisplayClass"
import { getViaVariant } from "../helpers/viaVariant"
import { directionOnLadder, VehicleDirection } from "../models/ladderVehicle"
import { status } from "../models/vehicleStatus"
import { Vehicle, VehicleId } from "../realtime.d"
import { Trip } from "../schedule"
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
  const trip: Trip | undefined = useTripContext(vehicle.tripId)
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
        label=""
        size={Size.Small}
        orientation={orientation}
        variant={trip && getViaVariant(trip.routePatternId)}
      />
      <div className="m-incoming-box__vehicle-label">
        {runIdToLabel(vehicle)}
      </div>
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
