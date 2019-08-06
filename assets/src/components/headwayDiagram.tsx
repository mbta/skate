import React, { useContext } from "react"
import StateDispatchContext from "../contexts/stateDispatchContext"
import VehiclesByRouteIdContext from "../contexts/vehiclesByRouteIdContext"
import runIdToLabel from "../helpers/runIdToLabel"
import { getViaVariant } from "../helpers/viaVariant"
import useTripContext from "../hooks/useTripContext"
import {
  allVehiclesForRoute,
  nextAndPreviousVehicle,
} from "../models/vehiclesByRouteId"
import { HeadwaySpacing, headwaySpacingToString } from "../models/vehicleStatus"
import { Vehicle, VehiclesForRoute } from "../realtime"
import { ByRouteId, Trip } from "../schedule"
import { selectVehicle } from "../state"
import VehicleIcon, { Orientation, Size } from "./vehicleIcon"

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

const humanSpacing = (spacing: HeadwaySpacing | null): string => {
  if (spacing === null || spacing === HeadwaySpacing.Ok) {
    return "good"
  }

  return headwaySpacingToString(spacing || HeadwaySpacing.Ok).replace("-", " ")
}

const OtherVehicle = ({ vehicle }: { vehicle: Vehicle }) => {
  const [, dispatch] = useContext(StateDispatchContext)
  const { id, tripId } = vehicle
  const trip: Trip | undefined = useTripContext(tripId)

  return (
    <div
      className="m-headway-diagram__other-vehicle"
      onClick={() => dispatch(selectVehicle(id))}
    >
      <VehicleIcon
        size={Size.Small}
        orientation={Orientation.Right}
        label={runIdToLabel(vehicle)}
        variant={trip && getViaVariant(trip.routePatternId)}
      />
    </div>
  )
}

const HeadwayDiagram = ({ vehicle }: { vehicle: Vehicle }) => {
  const vehiclesByRouteId: ByRouteId<VehiclesForRoute> = useContext(
    VehiclesByRouteIdContext
  )
  const trip: Trip | undefined = useTripContext(vehicle.tripId)
  const { nextVehicle, previousVehicle } = nextAndPreviousVehicle(
    allVehiclesForRoute(vehiclesByRouteId, vehicle.routeId),
    vehicle
  )
  const { headwaySecs, headwaySpacing, scheduledHeadwaySecs } = vehicle

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
            {humanSpacing(tailwaySpacing)}
          </div>
        </div>

        <div className="m-headway-diagram__selected-vehicle">
          <VehicleIcon
            size={Size.Medium}
            orientation={Orientation.Right}
            label={runIdToLabel(vehicle)}
            variant={trip && getViaVariant(trip.routePatternId)}
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

        {previousVehicle && <OtherVehicle vehicle={previousVehicle} />}
      </div>
    </div>
  )
}

export default HeadwayDiagram
