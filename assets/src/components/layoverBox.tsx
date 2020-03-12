import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import vehicleLabel from "../helpers/vehicleLabel"
import { drawnStatus } from "../models/vehicleStatus"
import { VehicleOrGhost } from "../realtime"
import { selectVehicle } from "../state"
import VehicleIcon, { Orientation, Size } from "./vehicleIcon"
import { blockWaiverAlertStyle } from "../models/blockWaiver"

export enum LayoverBoxPosition {
  Top = 1,
  Bottom,
}

interface Props {
  vehiclesAndGhosts: VehicleOrGhost[]
  position: LayoverBoxPosition
}

const LayoverVehicle = ({
  vehicleOrGhost,
  isBottomLayoverBox,
}: {
  vehicleOrGhost: VehicleOrGhost
  isBottomLayoverBox: boolean
}): ReactElement<HTMLDivElement> => {
  const [{ settings }, dispatch] = useContext(StateDispatchContext)
  const alertIconStyle = blockWaiverAlertStyle(vehicleOrGhost)

  return (
    <div
      key={vehicleOrGhost.id}
      onClick={() => dispatch(selectVehicle(vehicleOrGhost.id))}
      className="m-layover-box__vehicle"
    >
      <VehicleIcon
        label={vehicleLabel(vehicleOrGhost, settings)}
        orientation={isBottomLayoverBox ? Orientation.Right : Orientation.Left}
        size={Size.Small}
        status={drawnStatus(vehicleOrGhost)}
        variant={vehicleOrGhost.viaVariant}
        alertIcon={alertIconStyle}
      />
    </div>
  )
}

export const byLayoverDeparture = (isBottomLayoverBox: boolean) => (
  a: VehicleOrGhost,
  b: VehicleOrGhost
): number => {
  const [lt, gt] = isBottomLayoverBox ? [1, -1] : [-1, 1]
  if (
    !a.layoverDepartureTime ||
    !b.layoverDepartureTime ||
    a.layoverDepartureTime === b.layoverDepartureTime
  ) {
    return 0
  }

  return a.layoverDepartureTime > b.layoverDepartureTime ? gt : lt
}

const LayoverBox = ({
  vehiclesAndGhosts,
  position,
}: Props): ReactElement<HTMLDivElement> => {
  const isBottomLayoverBox = position === LayoverBoxPosition.Bottom
  const classModifier = isBottomLayoverBox ? "bottom" : "top"

  return (
    <div className={`m-layover-box m-layover-box--${classModifier}`}>
      {vehiclesAndGhosts
        .sort(byLayoverDeparture(isBottomLayoverBox))
        .map(vehicleOrGhost => (
          <LayoverVehicle
            vehicleOrGhost={vehicleOrGhost}
            isBottomLayoverBox={isBottomLayoverBox}
            key={vehicleOrGhost.id}
          />
        ))}
    </div>
  )
}

export default LayoverBox
