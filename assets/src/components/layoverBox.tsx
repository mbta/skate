import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import vehicleLabel from "../helpers/vehicleLabel"
import { drawnStatus } from "../models/vehicleStatus"
import { Vehicle } from "../realtime"
import { selectVehicle } from "../state"
import VehicleIcon, { Orientation, Size } from "./vehicleIcon"

export enum LayoverBoxPosition {
  Top = 1,
  Bottom,
}

interface Props {
  vehicles: Vehicle[]
  position: LayoverBoxPosition
}

const LayoverVehicle = ({
  vehicle,
  isBottomLayoverBox,
}: {
  vehicle: Vehicle
  isBottomLayoverBox: boolean
}): ReactElement<HTMLDivElement> => {
  const [{ settings }, dispatch] = useContext(StateDispatchContext)

  return (
    <div
      key={vehicle.id}
      onClick={() => dispatch(selectVehicle(vehicle.id))}
      className="m-layover-box__vehicle"
    >
      <VehicleIcon
        label={vehicleLabel(vehicle, settings)}
        orientation={isBottomLayoverBox ? Orientation.Right : Orientation.Left}
        size={Size.Small}
        status={drawnStatus(vehicle)}
        variant={vehicle.viaVariant}
      />
    </div>
  )
}

export const byLayoverDeparture = (isBottomLayoverBox: boolean) => (
  a: Vehicle,
  b: Vehicle
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
  vehicles,
  position,
}: Props): ReactElement<HTMLDivElement> => {
  const isBottomLayoverBox = position === LayoverBoxPosition.Bottom
  const classModifier = isBottomLayoverBox ? "bottom" : "top"

  return (
    <div className={`m-layover-box m-layover-box--${classModifier}`}>
      {vehicles.sort(byLayoverDeparture(isBottomLayoverBox)).map(vehicle => (
        <LayoverVehicle
          vehicle={vehicle}
          isBottomLayoverBox={isBottomLayoverBox}
          key={vehicle.id}
        />
      ))}
    </div>
  )
}

export default LayoverBox
