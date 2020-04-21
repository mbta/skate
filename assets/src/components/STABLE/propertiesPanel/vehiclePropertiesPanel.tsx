import React, { useState } from "react"
import useInterval from "../../../hooks/useInterval"
import { useTripShape } from "../../../hooks/useShapes"
import { hasBlockWaiver } from "../../../models/blockWaiver"
import { shouldShowHeadwayDiagram } from "../../../models/vehicle"
import { DataDiscrepancy, Vehicle } from "../../../realtime"
import { Route, Shape } from "../../../schedule"
import Map from "../../map"
import PropertiesList from "../../propertiesList"
import BlockWaiverList from "./blockWaiverList"
import Header from "./header"
import HeadwayDiagram from "./headwayDiagram"

interface Props {
  selectedVehicle: Vehicle
  route?: Route
}

const InvalidBanner = () => (
  <div className="m-vehicle-properties-panel__invalid-banner">
    <span className="m-vehicle-properties-panel__invalid-banner-title">
      Invalid
    </span>
    - We cannot match this vehicle to a scheduled trip at this time. This
    vehicle may be off-route or severely off-schedule.
  </div>
)

const NotAvailable = () => (
  <span className="m-vehicle-properties-panel__not-available">
    Not available
  </span>
)

const nowInSeconds = (): number => Math.floor(Date.now() / 1000)

const directionsUrl = (
  latitude: number,
  longitude: number
) => `https://www.google.com/maps/dir/?api=1\
&destination=${latitude.toString()},${longitude.toString()}\
&travelmode=driving`

const Location = ({ vehicle }: { vehicle: Vehicle }) => {
  const [epocNowInSeconds, setEpocNowInSeconds] = useState(nowInSeconds())

  const shapes: Shape[] = useTripShape(vehicle.tripId)

  useInterval(() => setEpocNowInSeconds(nowInSeconds()), 1000)
  const secondsAgo = (epocTime: number): string =>
    `${epocNowInSeconds - epocTime}s ago`

  const { isOffCourse, latitude, longitude, stopStatus, timestamp } = vehicle

  return (
    <div className="m-vehicle-properties-panel__location">
      <div className="m-properties-list__property-label">Next Stop</div>
      <div className="m-properties-list__property-value">
        {isOffCourse || vehicle.isShuttle ? (
          <NotAvailable />
        ) : (
          <>{stopStatus.stopName}</>
        )}
      </div>
      <div className="m-properties-list__property-label">Last GPS Ping</div>
      <div className="m-properties-list__property-value">
        {secondsAgo(timestamp)}
      </div>
      <a
        className="m-vehicle-properties-panel__link"
        href={directionsUrl(latitude, longitude)}
        target="_blank"
      >
        Directions
      </a>
      <div className="m-vehicle-properties-panel__map">
        <Map vehicles={[vehicle]} shapes={shapes} />
      </div>
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
    {dataDiscrepancies.map((dataDiscrepancy) => (
      <li key={dataDiscrepancy.attribute}>
        <Discrepancy dataDiscrepancy={dataDiscrepancy} />
      </li>
    ))}
  </ul>
)

const inDebugMode = (): boolean =>
  !!new URL(document.location.href).searchParams.get("debug")

const shouldShowDataDiscrepancies = ({ dataDiscrepancies }: Vehicle): boolean =>
  inDebugMode() && dataDiscrepancies.length > 0

const VehiclePropertiesPanel = ({ selectedVehicle, route }: Props) => (
  <div className="m-vehicle-properties-panel">
    <Header vehicle={selectedVehicle} route={route} />

    {selectedVehicle.isOffCourse && <InvalidBanner />}

    {hasBlockWaiver(selectedVehicle) && (
      <BlockWaiverList blockWaivers={selectedVehicle.blockWaivers} />
    )}

    {shouldShowHeadwayDiagram(selectedVehicle) && (
      <HeadwayDiagram vehicle={selectedVehicle} />
    )}

    <PropertiesList vehicleOrGhost={selectedVehicle} />

    <Location vehicle={selectedVehicle} />

    {shouldShowDataDiscrepancies(selectedVehicle) && (
      <DataDiscrepancies vehicle={selectedVehicle} />
    )}
  </div>
)

export default VehiclePropertiesPanel
