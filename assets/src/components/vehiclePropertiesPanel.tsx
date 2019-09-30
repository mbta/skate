import React, { useContext, useEffect, useState } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import detectSwipe, { SwipeDirection } from "../helpers/detectSwipe"
import useInterval from "../hooks/useInterval"
import featureIsEnabled from "../laboratoryFeatures"
import { formattedRunNumber } from "../models/shuttle"
import { isShuttle } from "../models/vehicle"
import { DataDiscrepancy, Vehicle } from "../realtime.d"
import { Route } from "../schedule.d"
import { deselectVehicle } from "../state"
import HeadwayDiagram from "./headwayDiagram"
import Map from "./map"
import Header from "./propertiesPanel/header"

interface Props {
  selectedVehicle: Vehicle
  selectedVehicleRoute?: Route
}

const Properties = ({ vehicle }: { vehicle: Vehicle }) => {
  const { runId, label, operatorId, operatorName } = vehicle

  return (
    <table className="m-properties-panel__properties">
      <tbody>
        <tr>
          <th className="m-properties-panel__property-label">Run</th>
          <td className="m-properties-panel__property-value">
            {isShuttle(vehicle)
              ? formattedRunNumber(vehicle)
              : runId || "Not Available"}
          </td>
        </tr>
        <tr>
          <th className="m-properties-panel__property-label">Vehicle</th>
          <td className="m-properties-panel__property-value">{label}</td>
        </tr>
        <tr>
          <th className="m-properties-panel__property-label">Operator</th>
          <td className="m-properties-panel__property-value">
            {operatorName} #{operatorId}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

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

  const { isOffCourse, latitude, longitude, stopStatus, timestamp } = vehicle

  return (
    <div className="m-vehicle-properties-panel__location">
      <div className="m-properties-panel__property-label">Next Stop</div>
      <div className="m-properties-panel__property-value">
        {isOffCourse || isShuttle(vehicle) ? (
          <NotAvailable />
        ) : (
          <>{stopStatus.stopName}</>
        )}
      </div>
      <div className="m-properties-panel__property-label">Last GPS Ping</div>
      <div className="m-properties-panel__property-value">
        {secondsAgo(timestamp)}
      </div>
      <a
        className="m-vehicle-properties-panel__link"
        href={directionsUrl(latitude, longitude)}
        target="_blank"
      >
        Directions
      </a>
      {!isShuttle(vehicle) && (
        <div className="m-vehicle-properties-panel__map">
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
    <div className="m-vehicle-properties-panel">
      <Header
        vehicle={selectedVehicle}
        selectedVehicleRoute={selectedVehicleRoute}
        shouldShowHeadwayDiagram={shouldShowHeadwayDiagram(selectedVehicle)}
      />

      {shouldShowHeadwayDiagram(selectedVehicle) && (
        <HeadwayDiagram vehicle={selectedVehicle} />
      )}

      <Properties vehicle={selectedVehicle} />

      <Location vehicle={selectedVehicle} />

      {shouldShowDataDiscrepancies(selectedVehicle) && (
        <DataDiscrepancies vehicle={selectedVehicle} />
      )}

      <button className="m-properties-panel__close" onClick={hideMe}>
        Close
      </button>
    </div>
  )
}

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
