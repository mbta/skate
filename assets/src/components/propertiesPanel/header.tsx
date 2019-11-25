import React, { useContext } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import vehicleLabel, { ghostLabel } from "../../helpers/vehicleLabel"
import {
  isShuttle,
  isVehicle,
  shouldShowHeadwayDiagram,
} from "../../models/vehicle"
import {
  drawnStatus,
  humanReadableScheduleAdherence,
  statusClass,
} from "../../models/vehicleStatus"
import { Vehicle, VehicleOrGhost } from "../../realtime"
import { Route } from "../../schedule"
import { deselectVehicle } from "../../state"
import CloseButton from "../closeButton"
import { RouteVariantName } from "../routeVariantName"
import VehicleIcon, { Orientation, Size } from "../vehicleIcon"

interface Props {
  vehicle: VehicleOrGhost
  route?: Route
}

const ScheduleAdherenceStatusIcon = () => (
  <div className="m-properties-panel__schedule-adherence-status-icon">
    <svg width="10" height="10">
      <circle cx="5" cy="5" r="5" />
    </svg>
  </div>
)

const ScheduleAdherenceStatusString = ({ vehicle }: { vehicle: Vehicle }) => (
  <div className="m-properties-panel__schedule-adherence-status-string">
    {humanReadableScheduleAdherence(vehicle)}
  </div>
)

const minutes = (seconds: number): number => Math.abs(Math.floor(seconds / 60))

const earlyOrLate = (scheduleAdherenceSecs: number): string =>
  scheduleAdherenceSecs <= 0 ? "early" : "late"

const scheduleAdherenceLabelString = ({
  scheduleAdherenceSecs,
}: Vehicle): string =>
  `(${minutes(scheduleAdherenceSecs)} min ${earlyOrLate(
    scheduleAdherenceSecs
  )})`

const ScheduleAdherenceLabel = ({ vehicle }: { vehicle: Vehicle }) => (
  <div className="m-properties-panel__schedule-adherence-label">
    {vehicle.isOffCourse ? "" : scheduleAdherenceLabelString(vehicle)}
  </div>
)

const ScheduleAdherence = ({ vehicle }: { vehicle: Vehicle }) => (
  <div
    className={`m-properties-panel__schedule-adherence ${statusClass(
      drawnStatus(vehicle)
    )}`}
  >
    <ScheduleAdherenceStatusIcon />
    <ScheduleAdherenceStatusString vehicle={vehicle} />
    <ScheduleAdherenceLabel vehicle={vehicle} />
  </div>
)

const HeadwayTarget = ({
  vehicle: { scheduledHeadwaySecs },
}: {
  vehicle: Vehicle
}) => (
  <div className="m-properties-panel__headway-target">
    <span className="m-properties-panel__headway-target-label">
      HEADWAY TARGET
    </span>
    <span className="m-properties-panel__headway-target-value">
      {minutes(scheduledHeadwaySecs)} min
    </span>
  </div>
)

const directionName = (
  { directionId }: VehicleOrGhost,
  route?: Route
): string => (route ? route.directionNames[directionId] : "")

const Header = ({ vehicle, route }: Props) => {
  const [{ settings }, dispatch] = useContext(StateDispatchContext)

  const hideMe = () => dispatch(deselectVehicle())

  return (
    <div className="m-properties-panel__header">
      <div className="m-properties-panel__label">
        {isVehicle(vehicle) ? (
          <VehicleIcon
            size={Size.Large}
            orientation={Orientation.Up}
            label={vehicleLabel(vehicle, settings)}
            variant={vehicle.viaVariant}
            status={drawnStatus(vehicle)}
          />
        ) : (
          <VehicleIcon
            size={Size.Large}
            orientation={Orientation.Up}
            label={ghostLabel(vehicle, settings)}
            variant={vehicle.viaVariant}
            status={"ghost"}
          />
        )}
      </div>
      <div className="m-properties-panel__variant">
        <div className="m-properties-panel__inbound-outbound">
          {directionName(vehicle, route)}
        </div>

        <RouteVariantName vehicle={vehicle} />

        {isVehicle(vehicle) && shouldShowHeadwayDiagram(vehicle) ? (
          <HeadwayTarget vehicle={vehicle} />
        ) : (
          isVehicle(vehicle) &&
          !isShuttle(vehicle) && <ScheduleAdherence vehicle={vehicle} />
        )}
      </div>
      <CloseButton onClick={hideMe} />
    </div>
  )
}

export default Header
