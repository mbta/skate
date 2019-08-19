import React, { Dispatch, ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import vehicleAdherenceDisplayClass from "../helpers/vehicleAdherenceDisplayClass"
import vehicleLabel from "../helpers/vehicleLabel"
import { Vehicle } from "../realtime"
import { Settings } from "../settings"
import { selectVehicle, SelectVehicleAction } from "../state"
import VehicleIcon, { Orientation, Size } from "./vehicleIcon"

type ClassModifier = "top" | "bottom"

interface Props {
  classModifier: ClassModifier
  vehicles: Vehicle[]
}

const layoverVehicle = (
  vehicle: Vehicle,
  classModifier: ClassModifier,
  dispatch: Dispatch<SelectVehicleAction>,
  settings: Settings
): ReactElement<HTMLDivElement> => {
  return (
    <div
      key={vehicle.id}
      onClick={() => dispatch(selectVehicle(vehicle.id))}
      className={`m-layover-box__vehicle ${vehicleAdherenceDisplayClass(
        vehicle.headwaySpacing,
        vehicle.scheduleAdherenceStatus
      )}`}
    >
      <VehicleIcon
        label={vehicleLabel(vehicle, settings.vehicleLabel)}
        orientation={
          classModifier === "bottom" ? Orientation.Right : Orientation.Left
        }
        size={Size.Small}
        variant={vehicle.viaVariant}
      />
    </div>
  )
}

const byLayoverDeparture = (classModifier: ClassModifier) => (
  a: Vehicle,
  b: Vehicle
): number => {
  const [gt, lt] = classModifier === "bottom" ? [1, -1] : [-1, 1]
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
  classModifier,
  vehicles,
}: Props): ReactElement<HTMLDivElement> => {
  const [{ settings }, dispatch] = useContext(StateDispatchContext)
  return (
    <div className={`m-layover-box m-layover-box--${classModifier}`}>
      {vehicles
        .sort(byLayoverDeparture(classModifier))
        .map(v => layoverVehicle(v, classModifier, dispatch, settings))}
    </div>
  )
}

export default LayoverBox
