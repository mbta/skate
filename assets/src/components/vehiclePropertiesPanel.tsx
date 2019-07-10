import React, { useContext, useEffect } from "react"
import DispatchContext from "../contexts/dispatchContext"
import detectSwipe, { SwipeDirection } from "../helpers/detectSwipe"
import { isOffCourse, status } from "../models/vehicleStatus"
import { DataDiscrepancy, Route, Vehicle } from "../skate.d"
import { deselectVehicle } from "../state"
import CloseButton from "./closeButton"
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
    {isOffCourse(vehicle) ? "Invalid" : vehicle.scheduleAdherenceStatus}
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
    {isOffCourse(vehicle) ? "" : scheduleAdherenceLabelString(vehicle)}
  </div>
)

const ScheduleAdherence = ({ vehicle }: { vehicle: Vehicle }) => (
  <div
    className={`m-vehicle-properties-panel__schedule-adherence ${status(
      vehicle
    )}`}
  >
    <ScheduleAdherenceStatusIcon />
    <ScheduleAdherenceStatusString vehicle={vehicle} />
    <ScheduleAdherenceLabel vehicle={vehicle} />
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
}) => (
  <div className="m-vehicle-properties-panel__header">
    <div className={`m-vehicle-properties-panel__label ${status(vehicle)}`}>
      <VehicleIcon
        size={Size.Large}
        orientation={Orientation.Up}
        label={vehicle.label}
        variant={vehicle.viaVariant}
      />
    </div>
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

const NotAvailable = () => (
  <span className="m-vehicle-properties-panel__not-available">
    Not available
  </span>
)

const Location = ({ vehicle }: { vehicle: Vehicle }) => {
  const {
    bearing,
    label,
    latitude,
    longitude,
    scheduleAdherenceStatus,
    stopStatus,
    viaVariant,
  } = vehicle

  return (
    <div className="m-vehicle-properties-panel__location">
      <div className="m-vehicle-properties-panel__vehicle-property-label">
        Next Stop
      </div>
      <div className="m-vehicle-properties-panel__vehicle-property-value">
        {isOffCourse(vehicle) ? <NotAvailable /> : <>{stopStatus.stopName}</>}
      </div>
      <a
        className="m-vehicle-properties-panel__link"
        href={directionsUrl(latitude, longitude)}
      >
        Directions
      </a>
      <Map
        bearing={bearing}
        label={label}
        latitude={latitude}
        longitude={longitude}
        scheduleAdherenceStatus={scheduleAdherenceStatus}
        viaVariant={viaVariant}
      />
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

const shouldShowDataDiscrepancies = ({ dataDiscrepancies }: Vehicle): boolean =>
  inDebugMode() && dataDiscrepancies.length > 0

const inDebugMode = (): boolean =>
  !!new URL(document.location.href).searchParams.get("debug")

export default VehiclePropertiesPanel
