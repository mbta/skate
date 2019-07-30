import React, { useContext } from "react"
import StateDispatchContext from "../contexts/stateDispatchContext"
import VehiclesByRouteIdContext from "../contexts/vehiclesByRouteIdContext"
import {
  allVehiclesForRoute,
  nextAndPreviousVehicle,
} from "../models/vehiclesByRouteId"
import { ByRouteId, HeadwaySpacing, Vehicle, VehiclesForRoute } from "../skate"
import { selectVehicle } from "../state"
import VehicleIcon, { Orientation, Size } from "./vehicleIcon"

const classNamify = (str: string): string => str.replace("_", "-")

const headwayAmount = (
  headwaySecs: number | null,
  scheduledHeadwaySecs: number
): string => {
  const differenceSecs = (headwaySecs || 0) - scheduledHeadwaySecs
  const sign = differenceSecs >= 0 ? "+" : "-"
  const differenceMins = minutes(differenceSecs)

  return `${sign}${differenceMins} min`
}

const minutes = (seconds: number): string => {
  const minutesUnrounded = seconds / 60
  const rounded = Math.round(minutesUnrounded * 10) / 10
  return Math.abs(rounded).toFixed(1)
}

const humanSpacing = (spacing: HeadwaySpacing): string => {
  if (spacing === "ok" || spacing === null) {
    return "good"
  }

  return spacing.replace("_", " ")
}

const OtherVehicle = ({ vehicle }: { vehicle: Vehicle }) => {
  const [, dispatch] = useContext(StateDispatchContext)
  const { id, label, viaVariant } = vehicle

  return (
    <div
      className="m-headway-diagram__other-vehicle"
      onClick={() => dispatch(selectVehicle(id))}
    >
      <VehicleIcon
        size={Size.Small}
        orientation={Orientation.Right}
        label={label}
        variant={viaVariant}
      />
    </div>
  )
}

const NoVehicleIcon = ({ spacingClass }: { spacingClass: string }) => (
  <div
    className={`m-headway-diagram__no-vehicle-icon m-headway-diagram__no-vehicle-icon--${spacingClass}`}
  >
    <svg width="6" height="6">
      <circle cx="3" cy="3" r="3" />
    </svg>
  </div>
)

const HeadwayDiagram = ({ vehicle }: { vehicle: Vehicle }) => {
  const vehiclesByRouteId: ByRouteId<VehiclesForRoute> = useContext(
    VehiclesByRouteIdContext
  )
  const { nextVehicle, previousVehicle } = nextAndPreviousVehicle(
    allVehiclesForRoute(vehiclesByRouteId, vehicle.routeId),
    vehicle
  )
  const {
    headwaySecs,
    headwaySpacing,
    label,
    scheduledHeadwaySecs,
    viaVariant,
  } = vehicle

  const headwaySpacingClass = classNamify(headwaySpacing || "ok")
  const tailwaySpacingClass = classNamify(
    previousVehicle && previousVehicle.headwaySpacing
      ? previousVehicle.headwaySpacing
      : "ok"
  )

  const tailwaySecs =
    previousVehicle && previousVehicle.headwaySecs
      ? previousVehicle.headwaySecs
      : 0
  const tailwaySpacing =
    previousVehicle && previousVehicle.headwaySpacing
      ? previousVehicle.headwaySpacing
      : null

  return (
    <div className="m-headway-diagram">
      <div className="m-headway-diagram__route-line-background" />

      <div className="m-headway-diagram__vehicles">
        {nextVehicle ? (
          <OtherVehicle vehicle={nextVehicle} />
        ) : (
          <NoVehicleIcon spacingClass={tailwaySpacingClass} />
        )}

        <div className={`m-headway-diagram__headway ${tailwaySpacingClass}`}>
          <div className="m-headway-diagram__headway-amount">
            {headwayAmount(tailwaySecs, scheduledHeadwaySecs)}
          </div>
          <div className="m-headway-diagram__headway-line" />
          <div className="m-headway-diagram__headway-status">
            {humanSpacing(tailwaySpacing)}
          </div>
        </div>

        <div className="m-headway-diagram__selected-vehicle">
          <VehicleIcon
            size={Size.Medium}
            orientation={Orientation.Right}
            label={label}
            variant={viaVariant}
          />
        </div>

        <div className={`m-headway-diagram__headway ${headwaySpacingClass}`}>
          <div className="m-headway-diagram__headway-amount">
            {headwayAmount(headwaySecs, scheduledHeadwaySecs)}
          </div>
          <div className="m-headway-diagram__headway-line" />
          <div className="m-headway-diagram__headway-status">
            {humanSpacing(headwaySpacing)}
          </div>
        </div>

        {previousVehicle ? (
          <OtherVehicle vehicle={previousVehicle} />
        ) : (
          <NoVehicleIcon spacingClass={headwaySpacingClass} />
        )}
      </div>
    </div>
  )
}

export default HeadwayDiagram
