import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import vehicleLabel, { runIdToLabel } from "../helpers/vehicleLabel"
import { blockWaiverAlertStyle } from "../models/blockWaiver"
import { crowdingLabel, OccupancyStatus } from "../models/crowding"
import {
  directionOnLadder,
  LadderDirection,
  VehicleDirection,
} from "../models/ladderDirection"
import { isGhost, isVehicle } from "../models/vehicle"
import { drawnStatus } from "../models/vehicleStatus"
import { Vehicle, VehicleId, VehicleOrGhost } from "../realtime.d"
import { selectVehicle } from "../state"
import CrowdingIcon from "./crowdingIcon"
import IconAlertCircle, { AlertIconStyle } from "./iconAlertCircle"
import VehicleIcon, { Orientation, Size, VehicleTooltip } from "./vehicleIcon"
import { scheduleAdherenceLabelString } from "./propertiesPanel/header"

const IncomingBoxVehicle = ({
  displayCrowding,
  vehicleOrGhost,
  ladderDirection,
  selectedVehicleId,
}: {
  displayCrowding: boolean
  vehicleOrGhost: VehicleOrGhost
  ladderDirection: LadderDirection
  selectedVehicleId: VehicleId | undefined
}) => {
  const [{ userSettings }, dispatch] = useContext(StateDispatchContext)
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
  const crowding = isVehicle(vehicleOrGhost) ? vehicleOrGhost.crowding : null
  const occupancyStatus: OccupancyStatus = crowding
    ? crowding.occupancyStatus
    : "NO_DATA"

  return (
    <VehicleTooltip
      block={vehicleOrGhost.blockId}
      run={runIdToLabel(vehicleOrGhost.runId)}
      vehicle={isGhost(vehicleOrGhost) ? "N/A" : vehicleOrGhost.label}
      variant={vehicleOrGhost.viaVariant}
      adherence={
        isGhost(vehicleOrGhost) || vehicleOrGhost.isOffCourse
          ? "N/A"
          : scheduleAdherenceLabelString(vehicleOrGhost)
      }
      operator={
        isGhost(vehicleOrGhost)
          ? "N/A"
          : `${vehicleOrGhost.operatorName} #${vehicleOrGhost.operatorId}`
      }
    >
      <button
        className={`m-incoming-box__vehicle ${selectedClass}`}
        onClick={() => dispatch(selectVehicle(vehicleOrGhost.id))}
      >
        <div className="m-incoming-box__vehicle-icon">
          {displayCrowding ? (
            <CrowdingIcon
              size={Size.Small}
              orientation={orientation}
              occupancyStatus={occupancyStatus}
            />
          ) : (
            <VehicleIcon
              size={Size.Small}
              orientation={orientation}
              variant={vehicleOrGhost.viaVariant}
              status={drawnStatus(vehicleOrGhost)}
            />
          )}
        </div>
        {displayCrowding || alertIconStyle === undefined ? null : (
          <IconAlertCircle style={alertIconStyle} />
        )}
        <div className="m-incoming-box__vehicle-label">
          {displayCrowding
            ? crowdingLabel(vehicleOrGhost as Vehicle)
            : vehicleLabel(vehicleOrGhost, userSettings)}
        </div>
      </button>
    </VehicleTooltip>
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
      <IncomingBoxVehicle
        displayCrowding={!!displayCrowding && isVehicle(vehicleOrGhost)}
        vehicleOrGhost={vehicleOrGhost}
        ladderDirection={ladderDirection}
        selectedVehicleId={selectedVehicleId}
        key={vehicleOrGhost.id}
      />
    ))}
  </div>
)

export default IncomingBox
