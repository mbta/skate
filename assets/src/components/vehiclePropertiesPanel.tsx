import React, { useContext, useEffect } from "react"
import DispatchContext from "../contexts/dispatchContext"
import detectSwipe, { SwipeDirection } from "../helpers/detectSwipe"
import { Route, Vehicle } from "../skate.d"
import { deselectVehicle } from "../state"
import CloseButton from "./closeButton"

interface Props {
  selectedVehicle: Vehicle
  selectedVehicleRoute?: Route
}

const ScheduleAdherenceStatusIcon = ({
  vehicle: { scheduleAdherenceStatus },
}: {
  vehicle: Vehicle
}) => (
  <div
    className={`m-vehicle-properties-panel__schedule-adherence-status-icon ${scheduleAdherenceStatus}`}
  >
    <svg width="10" height="10">
      <circle cx="5" cy="5" r="5" />
    </svg>
  </div>
)

const ScheduleAdherenceStatusString = ({
  vehicle: { scheduleAdherenceStatus },
}: {
  vehicle: Vehicle
}) => (
  <div className="m-vehicle-properties-panel__schedule-adherence-status-string">
    {scheduleAdherenceStatus}
  </div>
)

const minutes = (seconds: number): number => Math.abs(Math.floor(seconds / 60))

const earlyOrLateLabel = ({
  scheduleAdherenceSecs,
  scheduleAdherenceStatus,
}: Vehicle): string =>
  `(${minutes(scheduleAdherenceSecs)} min ${scheduleAdherenceStatus})`

const scheduleAdherenceLabelString = (vehicle: Vehicle): string => {
  const { scheduleAdherenceStatus } = vehicle
  if (
    scheduleAdherenceStatus === "early" ||
    scheduleAdherenceStatus === "late"
  ) {
    return earlyOrLateLabel(vehicle)
  } else {
    return ""
  }
}

const ScheduleAdherenceLabel = ({ vehicle }: { vehicle: Vehicle }) => (
  <div className="m-vehicle-properties-panel__schedule-adherence-label">
    {scheduleAdherenceLabelString(vehicle)}
  </div>
)

const ScheduleAdherence = ({ vehicle }: { vehicle: Vehicle }) => {
  return (
    <div className="m-vehicle-properties-panel__schedule-adherence">
      <ScheduleAdherenceStatusIcon vehicle={vehicle} />
      <ScheduleAdherenceStatusString vehicle={vehicle} />
      <ScheduleAdherenceLabel vehicle={vehicle} />
    </div>
  )
}

const Header = ({
  vehicle,
  selectedVehicleRoute,
  hideMe,
}: {
  vehicle: Vehicle
  selectedVehicleRoute?: Route
  hideMe: () => void
}) => (
  <div className="m-vehicle-properties-panel__header">
    <div className="m-vehicle-properties-panel__label">{vehicle.label}</div>
    <div className="m-vehicle-properties-panel__variant">
      <div className="m-vehicle-properties-panel__inbound-outbound">
        {directionName(vehicle, selectedVehicleRoute)}
      </div>
      <div className="m-vehicle-properties-panel__variant-name">
        {formatRouteVariant(vehicle)}
      </div>
      <ScheduleAdherence vehicle={vehicle} />
    </div>
    <CloseButton onClick={hideMe} />
  </div>
)

const Properties = ({
  vehicle: { runId, label, operatorId, operatorName },
}: {
  vehicle: Vehicle
}) => (
  <table className="m-vehicle-properties-panel__vehicle-properties">
    <tbody>
      <tr>
        <th className="m-vehicle-properties-panel__vehicle-property-label">
          Run
        </th>
        <td className="m-vehicle-properties-panel__vehicle-property-value">
          {runId}
        </td>
      </tr>
      <tr>
        <th className="m-vehicle-properties-panel__vehicle-property-label">
          Vehicle
        </th>
        <td className="m-vehicle-properties-panel__vehicle-property-value">
          {label}
        </td>
      </tr>
      <tr>
        <th className="m-vehicle-properties-panel__vehicle-property-label">
          Operator
        </th>
        <td className="m-vehicle-properties-panel__vehicle-property-value">
          {operatorName} #{operatorId}
        </td>
      </tr>
    </tbody>
  </table>
)

const Location = ({
  vehicle: { latitude, longitude, stopStatus },
}: {
  vehicle: Vehicle
}) => (
  <div className="m-vehicle-properties-panel__location">
    <div className="m-vehicle-properties-panel__vehicle-property-label">
      Next Stop
    </div>
    <div className="m-vehicle-properties-panel__vehicle-property-value">
      {stopStatus.stopName}
    </div>
    <a
      className="m-vehicle-properties-panel__link"
      href={directionsUrl(latitude, longitude)}
    >
      Directions
    </a>
  </div>
)

const VehiclePropertiesPanel = ({
  selectedVehicle,
  selectedVehicleRoute,
}: Props) => {
  const dispatch = useContext(DispatchContext)

  const hideMe = () => dispatch(deselectVehicle())

  useEffect(() => {
    const handleSwipe = (swipeDirection: SwipeDirection) => {
      if (swipeDirection === "Right") {
        hideMe()
      }
    }

    return detectSwipe("m-vehicle-properties-panel", handleSwipe)
  })

  return (
    <>
      <div
        id="m-vehicle-properties-panel"
        className="m-vehicle-properties-panel"
      >
        <Header
          vehicle={selectedVehicle}
          selectedVehicleRoute={selectedVehicleRoute}
          hideMe={hideMe}
        />

        <Properties vehicle={selectedVehicle} />

        <Location vehicle={selectedVehicle} />

        <button className="m-vehicle-properties-panel__close" onClick={hideMe}>
          Close
        </button>
      </div>

      <div
        className="m-vehicle-properties-panel__modal-overlay"
        onClick={hideMe}
      />
    </>
  )
}

export const formatRouteVariant = (vehicle: Vehicle): string => {
  const { routeId, viaVariant, headsign } = vehicle
  const viaVariantFormatted = viaVariant && viaVariant !== "_" ? viaVariant : ""
  const headsignFormatted = headsign ? ` ${headsign}` : ""
  return `${routeId}_${viaVariantFormatted}${headsignFormatted}`
}

const directionName = (
  { directionId }: Vehicle,
  selectedVehicleRoute?: Route
): string =>
  selectedVehicleRoute ? selectedVehicleRoute.directionNames[directionId] : ""

const directionsUrl = (
  latitude: number,
  longitude: number
) => `https://www.google.com/maps/dir/?api=1\
&destination=${latitude.toString()},${longitude.toString()}\
&travelmode=driving`

export default VehiclePropertiesPanel
