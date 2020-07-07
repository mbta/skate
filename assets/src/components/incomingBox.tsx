import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import vehicleLabel from "../helpers/vehicleLabel"
import { blockWaiverAlertStyle } from "../models/blockWaiver"
import {
  directionOnLadder,
  LadderDirection,
  VehicleDirection,
} from "../models/ladderDirection"
import { isVehicle } from "../models/vehicle"
import { drawnStatus } from "../models/vehicleStatus"
import { VehicleId, VehicleOrGhost } from "../realtime.d"
import { selectVehicle } from "../state"
import IconAlertCircle, { AlertIconStyle } from "./iconAlertCircle"
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
  const alertIconStyle: AlertIconStyle | undefined = blockWaiverAlertStyle(
    vehicleOrGhost
  )

  return (
    <button
      className={`m-incoming-box__vehicle ${selectedClass}`}
      onClick={() => dispatch(selectVehicle(vehicleOrGhost.id))}
    >
      <div className="m-incoming-box__vehicle-icon">
        <VehicleIcon
          size={Size.Small}
          orientation={orientation}
          variant={vehicleOrGhost.viaVariant}
          status={drawnStatus(vehicleOrGhost)}
        />
      </div>
      {alertIconStyle === undefined ? null : (
        <IconAlertCircle style={alertIconStyle} />
      )}
      <div className="m-incoming-box__vehicle-label">
        {vehicleLabel(vehicleOrGhost, settings)}
      </div>
    </button>
  )
}

const IncomingBoxVehicleOrCrowding = ({
  displayCrowding,
  vehicleOrGhost,
  ladderDirection,
  selectedVehicleId,
}: {
  displayCrowding?: boolean
  vehicleOrGhost: VehicleOrGhost
  ladderDirection: LadderDirection
  selectedVehicleId: VehicleId | undefined
}) => {
  const useCrowdingIcon = displayCrowding && isVehicle(vehicleOrGhost)
  if (useCrowdingIcon) {
    return <span>TODO</span>
  }
  return (
    <IncomingBoxVehicle
      vehicleOrGhost={vehicleOrGhost}
      ladderDirection={ladderDirection}
      selectedVehicleId={selectedVehicleId}
    />
  )
}

const IncomingBox = ({
  displayCrowding,
  vehiclesAndGhosts,
  ladderDirection,
  selectedVehicleId,
}: {
  displayCrowding?: boolean
  vehiclesAndGhosts: VehicleOrGhost[]
  ladderDirection: LadderDirection
  selectedVehicleId: VehicleId | undefined
}) => (
  <div className="m-incoming-box">
    {vehiclesAndGhosts.map((vehicleOrGhost) => (
      <IncomingBoxVehicleOrCrowding
        displayCrowding={displayCrowding}
        vehicleOrGhost={vehicleOrGhost}
        ladderDirection={ladderDirection}
        selectedVehicleId={selectedVehicleId}
        key={vehicleOrGhost.id}
      />
    ))}
  </div>
)

export default IncomingBox
