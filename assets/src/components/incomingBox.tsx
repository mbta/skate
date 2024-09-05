import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import vehicleLabel from "../helpers/vehicleLabel"
import { blockWaiverAlertStyle } from "../models/blockWaiver"
import { crowdingLabel, OccupancyStatus } from "../models/crowding"
import {
  directionOnLadder,
  LadderDirection,
  VehicleDirection,
} from "../models/ladderDirection"
import { isVehicleInScheduledService } from "../models/vehicle"
import { drawnStatus } from "../models/vehicleStatus"
import { VehicleInScheduledService, VehicleId, Ghost } from "../realtime"
import CrowdingIcon from "./crowdingIcon"
import IconAlertCircle, { AlertIconStyle } from "./iconAlertCircle"
import VehicleIcon, { Orientation, Size, VehicleTooltip } from "./vehicleIcon"
import { usePanelStateFromStateDispatchContext } from "../hooks/usePanelState"

const IncomingBoxVehicle = ({
  displayCrowding,
  vehicleOrGhost,
  ladderDirection,
  selectedVehicleId,
}: {
  displayCrowding: boolean
  vehicleOrGhost: VehicleInScheduledService | Ghost
  ladderDirection: LadderDirection
  selectedVehicleId: VehicleId | undefined
}) => {
  const [{ userSettings }] = useContext(StateDispatchContext)

  const { openVehiclePropertiesPanel } = usePanelStateFromStateDispatchContext()

  const selectedClass =
    vehicleOrGhost.id === selectedVehicleId
      ? " c-incoming-box__vehicle--selected"
      : ""
  const orientation =
    directionOnLadder(
      vehicleOrGhost.incomingTripDirectionId !== null
        ? vehicleOrGhost.incomingTripDirectionId
        : vehicleOrGhost.directionId,
      ladderDirection
    ) === VehicleDirection.Down
      ? Orientation.Down
      : Orientation.Up
  const alertIconStyle: AlertIconStyle | undefined =
    blockWaiverAlertStyle(vehicleOrGhost)
  const crowding = isVehicleInScheduledService(vehicleOrGhost)
    ? vehicleOrGhost.crowding
    : null
  const occupancyStatus: OccupancyStatus = crowding
    ? crowding.occupancyStatus
    : "NO_DATA"

  return (
    <VehicleTooltip vehicleOrGhost={vehicleOrGhost}>
      <button
        className={`c-incoming-box__vehicle${selectedClass}`}
        onClick={() => openVehiclePropertiesPanel(vehicleOrGhost)}
      >
        <div className="c-incoming-box__vehicle-icon">
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
              userSettings={userSettings}
            />
          )}
        </div>
        {displayCrowding || alertIconStyle === undefined ? null : (
          <IconAlertCircle style={alertIconStyle} />
        )}
        <div className="c-incoming-box__vehicle-label">
          {displayCrowding
            ? crowdingLabel(vehicleOrGhost as VehicleInScheduledService)
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
  vehiclesAndGhosts: (VehicleInScheduledService | Ghost)[]
  ladderDirection: LadderDirection
  selectedVehicleId: VehicleId | undefined
}) => (
  <div className="c-incoming-box">
    {vehiclesAndGhosts.map((vehicleOrGhost) => (
      <IncomingBoxVehicle
        displayCrowding={
          !!displayCrowding && isVehicleInScheduledService(vehicleOrGhost)
        }
        vehicleOrGhost={vehicleOrGhost}
        ladderDirection={ladderDirection}
        selectedVehicleId={selectedVehicleId}
        key={vehicleOrGhost.id}
      />
    ))}
  </div>
)

export default IncomingBox
