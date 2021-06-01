import React, { useContext } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { VehiclesByRouteIdContext } from "../../contexts/vehiclesByRouteIdContext"
import vehicleLabel from "../../helpers/vehicleLabel"
import {
  allVehiclesForRoute,
  nextAndPreviousVehicle,
} from "../../models/vehiclesByRouteId"
import {
  HeadwaySpacing,
  headwaySpacingToString,
  humanReadableHeadwaySpacing,
} from "../../models/vehicleStatus"
import { Vehicle, VehicleOrGhost } from "../../realtime"
import { ByRouteId } from "../../schedule"
import { selectVehicle } from "../../state"
import VehicleIcon, { Orientation, Size } from "../vehicleIcon"

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

const OtherVehicle = ({ vehicle }: { vehicle: Vehicle }) => {
  const [{ userSettings }, dispatch] = useContext(StateDispatchContext)
  const { viaVariant } = vehicle

  return (
    <div
      className="m-headway-diagram__other-vehicle"
      onClick={() => dispatch(selectVehicle(vehicle))}
    >
      <VehicleIcon
        size={Size.Small}
        orientation={Orientation.Right}
        label={vehicleLabel(vehicle, userSettings)}
        variant={viaVariant}
        userSettings={userSettings}
      />
    </div>
  )
}

const HeadwayDiagram = ({ vehicle }: { vehicle: Vehicle }) => {
  const [{ userSettings }] = useContext(StateDispatchContext)
  const vehiclesByRouteId: ByRouteId<VehicleOrGhost[]> = useContext(
    VehiclesByRouteIdContext
  )
  const { nextVehicle, previousVehicle } = nextAndPreviousVehicle(
    allVehiclesForRoute(vehiclesByRouteId, vehicle.routeId!),
    vehicle
  )
  const {
    headwaySecs,
    headwaySpacing,
    scheduledHeadwaySecs,
    viaVariant,
  } = vehicle

  const headwaySpacingClass = headwaySpacingToString(
    headwaySpacing || HeadwaySpacing.Ok
  )
  const tailwaySpacingClass = headwaySpacingToString(
    nextVehicle && nextVehicle.headwaySpacing
      ? nextVehicle.headwaySpacing
      : HeadwaySpacing.Ok
  )

  const tailwaySecs =
    nextVehicle && nextVehicle.headwaySecs ? nextVehicle.headwaySecs : 0
  const tailwayScheduledHeadwaySecs = nextVehicle
    ? nextVehicle.scheduledHeadwaySecs
    : 0
  const tailwaySpacing =
    nextVehicle && nextVehicle.headwaySpacing
      ? nextVehicle.headwaySpacing
      : null

  return (
    <div className="m-headway-diagram">
      <div className="m-headway-diagram__route-line-background" />

      <div className="m-headway-diagram__vehicles">
        {nextVehicle && <OtherVehicle vehicle={nextVehicle} />}

        <div className={`m-headway-diagram__headway ${tailwaySpacingClass}`}>
          <div className="m-headway-diagram__headway-amount">
            {headwayAmount(tailwaySecs, tailwayScheduledHeadwaySecs)}
          </div>
          <div className="m-headway-diagram__headway-line" />
          <div className="m-headway-diagram__headway-status">
            {humanReadableHeadwaySpacing(tailwaySpacing)}
          </div>
        </div>

        <div className="m-headway-diagram__selected-vehicle">
          <VehicleIcon
            size={Size.Medium}
            orientation={Orientation.Right}
            label={vehicleLabel(vehicle, userSettings)}
            variant={viaVariant}
            userSettings={userSettings}
          />
        </div>

        <div className={`m-headway-diagram__headway ${headwaySpacingClass}`}>
          <div className="m-headway-diagram__headway-amount">
            {headwayAmount(headwaySecs, scheduledHeadwaySecs)}
          </div>
          <div className="m-headway-diagram__headway-line" />
          <div className="m-headway-diagram__headway-status">
            {humanReadableHeadwaySpacing(headwaySpacing)}
          </div>
        </div>

        {previousVehicle && <OtherVehicle vehicle={previousVehicle} />}
      </div>
    </div>
  )
}

export default HeadwayDiagram
