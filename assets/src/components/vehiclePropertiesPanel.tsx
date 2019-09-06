import React, { useContext, useEffect, useState } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import detectSwipe, { SwipeDirection } from "../helpers/detectSwipe"
import vehicleLabel from "../helpers/vehicleLabel"
import useInterval from "../hooks/useInterval"
import featureIsEnabled from "../laboratoryFeatures"
import {
  drawnStatus,
  humanReadableScheduleAdherence,
  statusClass,
} from "../models/vehicleStatus"
import { DataDiscrepancy, Vehicle } from "../realtime.d"
import { Route } from "../schedule.d"
import { deselectVehicle } from "../state"
import CloseButton from "./closeButton"
import HeadwayDiagram from "./headwayDiagram"
import Map from "./map"
import VehicleIcon, { Orientation, Size } from "./vehicleIcon"

interface Props {
  selectedVehicle: Vehicle
  selectedVehicleRoute?: Route
}

const ScheduleAdherenceStatusIcon = () => (
  <div className="m-vehicle-properties-panel__schedule-adherence-status-icon">
    <svg width="10" height="10">
      <circle cx="5" cy="5" r="5" />
    </svg>
  </div>
)

const ScheduleAdherenceStatusString = ({ vehicle }: { vehicle: Vehicle }) => (
  <div className="m-vehicle-properties-panel__schedule-adherence-status-string">
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
  <div className="m-vehicle-properties-panel__schedule-adherence-label">
    {vehicle.isOffCourse || vehicle.isAShuttle
      ? ""
      : scheduleAdherenceLabelString(vehicle)}
  </div>
)

const ScheduleAdherence = ({ vehicle }: { vehicle: Vehicle }) => (
  <div
    className={`m-vehicle-properties-panel__schedule-adherence ${statusClass(
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
  <div className="m-vehicle-properties-panel__headway-target">
    <span className="m-vehicle-properties-panel__headway-target-label">
      HEADWAY TARGET
    </span>
    <span className="m-vehicle-properties-panel__headway-target-value">
      {minutes(scheduledHeadwaySecs)} min
    </span>
  </div>
)

const Header = ({
  vehicle,
  selectedVehicleRoute,
  hideMe,
}: {
  vehicle: Vehicle
  selectedVehicleRoute?: Route
  hideMe: () => void
}) => {
  const [{ settings }] = useContext(StateDispatchContext)

  return (
    <div className="m-vehicle-properties-panel__header">
      <div className="m-vehicle-properties-panel__label">
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Up}
          label={vehicleLabel(vehicle, settings.vehicleLabel)}
          variant={vehicle.viaVariant}
          status={drawnStatus(vehicle)}
        />
      </div>
      <div className="m-vehicle-properties-panel__variant">
        <div className="m-vehicle-properties-panel__inbound-outbound">
          {directionName(vehicle, selectedVehicleRoute)}
        </div>
        <div className="m-vehicle-properties-panel__variant-name">
          {formatRouteVariant(vehicle)}
        </div>
        {shouldShowHeadwayDiagram(vehicle) ? (
          <HeadwayTarget vehicle={vehicle} />
        ) : (
          <ScheduleAdherence vehicle={vehicle} />
        )}
      </div>
      <CloseButton onClick={hideMe} />
    </div>
  )
}

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
          {runId || "Not Available"}
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

const NotAvailable = () => (
  <span className="m-vehicle-properties-panel__not-available">
    Not available
  </span>
)

const nowInSeconds = (): number => Math.floor(Date.now() / 1000)

const Location = ({ vehicle }: { vehicle: Vehicle }) => {
  const [epocNowInSeconds, setEpocNowInSeconds] = useState(nowInSeconds())
  useInterval(() => setEpocNowInSeconds(nowInSeconds()), 1000)
  const secondsAgo = (epocTime: number): string =>
    `${epocNowInSeconds - epocTime}s ago`

  const {
    isAShuttle,
    isOffCourse,
    latitude,
    longitude,
    stopStatus,
    timestamp,
  } = vehicle

  return (
    <div className="m-vehicle-properties-panel__location">
      <div className="m-vehicle-properties-panel__vehicle-property-label">
        Next Stop
      </div>
      <div className="m-vehicle-properties-panel__vehicle-property-value">
        {isOffCourse ? <NotAvailable /> : <>{stopStatus.stopName}</>}
      </div>
      <div className="m-vehicle-properties-panel__vehicle-property-label">
        Last GPS Ping
      </div>
      <div className="m-vehicle-properties-panel__vehicle-property-value">
        {secondsAgo(timestamp)}
      </div>
      <a
        className="m-vehicle-properties-panel__link"
        href={directionsUrl(latitude, longitude)}
      >
        Directions
      </a>
      {!isAShuttle && (
        <div className="m-vehicle-map">
          <Map vehicles={[vehicle]} centerOnVehicle={vehicle.id} />
        </div>
      )}
    </div>
  )
}

const Discrepancy = ({
  dataDiscrepancy: { attribute, sources },
}: {
  dataDiscrepancy: DataDiscrepancy
}) => (
  <dl className="m-vehicle-properties-panel__data-discrepancy">
    <dt>{attribute}</dt>
    <dd>
      <ul>
        {sources.map(({ id, value }) => (
          <li key={`${attribute}-${id}`}>
            <span className="m-vehicle-properties-panel__data-discrepancy-source-id">
              {id}
            </span>
            <span className="m-vehicle-properties-panel__data-discrepancy-source-value">
              {value}
            </span>
          </li>
        ))}
      </ul>
    </dd>
  </dl>
)

const DataDiscrepancies = ({
  vehicle: { dataDiscrepancies },
}: {
  vehicle: Vehicle
}) => (
  <ul className="m-vehicle-properties-panel__data-discrepancies">
    {dataDiscrepancies.map(dataDiscrepancy => (
      <li key={dataDiscrepancy.attribute}>
        <Discrepancy dataDiscrepancy={dataDiscrepancy} />
      </li>
    ))}
  </ul>
)

export const handleSwipe = (hideMe: () => void) => (
  swipeDirection: SwipeDirection,
  target: HTMLElement | null
) => {
  if (target && target.id === "id-vehicle-map") {
    return
  }

  if (swipeDirection === "Right") {
    hideMe()
  }
}

const VehiclePropertiesPanel = ({
  selectedVehicle,
  selectedVehicleRoute,
}: Props) => {
  const [, dispatch] = useContext(StateDispatchContext)

  const hideMe = () => dispatch(deselectVehicle())

  useEffect(() => {
    return detectSwipe("m-vehicle-properties-panel", handleSwipe(hideMe))
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

        {shouldShowHeadwayDiagram(selectedVehicle) && (
          <HeadwayDiagram vehicle={selectedVehicle} />
        )}

        <Properties vehicle={selectedVehicle} />

        <Location vehicle={selectedVehicle} />

        {shouldShowDataDiscrepancies(selectedVehicle) && (
          <DataDiscrepancies vehicle={selectedVehicle} />
        )}

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
  if (vehicle.isAShuttle) {
    return "Shuttle"
  }

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

const shouldShowHeadwayDiagram = ({
  headwaySpacing,
  isOnRoute,
}: Vehicle): boolean =>
  featureIsEnabled("headway_ladder_colors") &&
  headwaySpacing !== null &&
  isOnRoute

const shouldShowDataDiscrepancies = ({ dataDiscrepancies }: Vehicle): boolean =>
  inDebugMode() && dataDiscrepancies.length > 0

const inDebugMode = (): boolean =>
  !!new URL(document.location.href).searchParams.get("debug")

export default VehiclePropertiesPanel
