import React, { Dispatch, ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { TripsByIdContext } from "../contexts/tripsByIdContext"
import runIdToLabel from "../helpers/runIdToLabel"
import { getViaVariant } from "../helpers/viaVariant"
import { Vehicle } from "../realtime"
import { Trip, TripsById } from "../schedule"
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
  tripsById: TripsById,
  dispatch: Dispatch<SelectVehicleAction>
): ReactElement<HTMLDivElement> => {
  const trip: Trip | undefined = tripsById[vehicle.tripId]
  return (
    <div
      key={vehicle.id}
      onClick={() => dispatch(selectVehicle(vehicle.id))}
      className="m-layover-box__vehicle"
    >
      <VehicleIcon
        label={runIdToLabel(vehicle)}
        orientation={
          classModifier === "bottom" ? Orientation.Right : Orientation.Left
        }
        size={Size.Medium}
        variant={getViaVariant(trip && trip.routePatternId)}
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
  const [, dispatch] = useContext(StateDispatchContext)
  const tripsById = useContext(TripsByIdContext)
  return (
    <div className={`m-layover-box m-layover-box--${classModifier}`}>
      {vehicles
        .sort(byLayoverDeparture(classModifier))
        .map(v => layoverVehicle(v, classModifier, tripsById, dispatch))}
    </div>
  )
}

export default LayoverBox
