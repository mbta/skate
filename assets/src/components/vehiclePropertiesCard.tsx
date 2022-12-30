import React, { ReactNode, useContext, useId } from "react"
import { useRoute } from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { className } from "../helpers/dom"
import vehicleLabel from "../helpers/vehicleLabel"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import { useNearestIntersection } from "../hooks/useNearestIntersection"
import { emptyLadderDirectionsByRouteId } from "../models/ladderDirection"
import { currentRouteTab } from "../models/routeTab"
import { directionName } from "../models/vehicle"
import {
  drawnStatus,
  humanReadableScheduleAdherence,
  statusClasses,
} from "../models/vehicleStatus"
import { Vehicle } from "../realtime"
import { secondsToMinutes } from "../util/dateTime"
import { CloseButton2 } from "./closeButton"
import { RouteVariantName2 } from "./routeVariantName"
import StreetViewButton, { WorldPositionBearing } from "./streetViewButton"
import { Size, VehicleIcon2, vehicleOrientation } from "./vehicleIcon"

interface VehicleProp {
  vehicle: Vehicle
}

//#region Card Title Bar
const DataStaleTime = ({
  timestamp,
}: {
  timestamp: number
}): React.ReactElement => {
  const epochNowInSeconds = useCurrentTimeSeconds()
  return (
    <output aria-label="Last Updated Time" className="data-stale-time">
      Updated {epochNowInSeconds - timestamp} sec ago
    </output>
  )
}

const VehicleDataStaleTime = ({ vehicle }: VehicleProp): React.ReactElement => (
  <DataStaleTime timestamp={vehicle.timestamp} />
)
//#endregion

//#region Vehicle Summary

const VehicleIcon1 = ({ vehicle }: VehicleProp): React.ReactElement => {
  const [{ routeTabs, userSettings }] = useContext(StateDispatchContext)
  const currentTab = currentRouteTab(routeTabs)
  const ladderDirections = currentTab
    ? currentTab.ladderDirections
    : emptyLadderDirectionsByRouteId

  return (
    <div className="m-vehicle-route-summary__icon">
      <VehicleIcon2
        size={Size.Large}
        orientation={vehicleOrientation(vehicle, ladderDirections)}
        label={vehicleLabel(vehicle, userSettings)}
        variant={vehicle.viaVariant}
        status={drawnStatus(vehicle)}
        userSettings={userSettings}
      />
    </div>
  )
}

const VehicleRouteDirection = ({
  vehicle,
}: VehicleProp): React.ReactElement => {
  const route = useRoute(vehicle.routeId)
  return (
    <output title="Route Direction" className="m-vehicle-route-direction">
      {directionName(vehicle, route)}
    </output>
  )
}

const VisualSeparator = (): React.ReactElement => (
  // Visual accent to provide separation between elements
  // This object is strictly for visual presentation
  <object
    className="m-vehicle-route-summary__separator"
    aria-hidden="true"
  ></object>
)

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

const earlyOrLate = (scheduleAdherenceSecs: number): string =>
  scheduleAdherenceSecs <= 0 ? "early" : "late"

export const scheduleAdherenceLabelString = ({
  scheduleAdherenceSecs,
}: Vehicle): string =>
  `${secondsToMinutes(scheduleAdherenceSecs)} min ${earlyOrLate(
    scheduleAdherenceSecs
  )}`

const ScheduleAdherenceLabel = ({ vehicle }: { vehicle: Vehicle }) => (
  <div className="m-properties-panel__schedule-adherence-label">
    {vehicle.isOffCourse ? "" : `(${scheduleAdherenceLabelString(vehicle)})`}
  </div>
)

const ScheduleAdherence1 = ({ vehicle }: { vehicle: Vehicle }) => {
  const [{ userSettings }] = useContext(StateDispatchContext)

  return (
    <output
      aria-label="Vehicle Adherence"
      className={`m-properties-panel__schedule-adherence ${className(
        statusClasses(drawnStatus(vehicle), userSettings.vehicleAdherenceColors)
      )}`}
    >
      <ScheduleAdherenceStatusIcon />
      <ScheduleAdherenceStatusString vehicle={vehicle} />
      &nbsp;
      <ScheduleAdherenceLabel vehicle={vehicle} />
    </output>
  )
}

const VehicleRouteSummary = ({ vehicle }: VehicleProp): React.ReactElement => (
  <div className="m-vehicle-route-summary">
    <VehicleIcon1 vehicle={vehicle} />

    <ScheduleAdherence1 vehicle={vehicle} />

    <VehicleRouteDirection vehicle={vehicle} />

    <RouteVariantName2 vehicle={vehicle} />

    <VisualSeparator />
  </div>
)
//#endregion

//#region Vehicle Work Info
/* const DataPairTable = (props): React.ReactElement => (
  <>
    <div className="m-key-value-table">
      <table className="m-key-value-table__table">
        <tbody className={`m-datalist-column-flex $`}></tbody>
      </table>
    </div>
  </>
) */

interface NameValue {
  name: string
  children: ReactNode
  idPrefix?: string
}

const TrNameValue = ({
  name,
  children: value,
  idPrefix,
}: NameValue): React.ReactElement => {
  const id = (idPrefix ?? name) + useId()
  return (
    <tr>
      <th scope="row" id={id}>
        {name}
      </th>
      <td aria-labelledby={id}>{value}</td>
    </tr>
  )
}

const VehicleWorkInfo = ({ vehicle }: VehicleProp): React.ReactElement => (
  // <PropertiesList properties={vehicleProperties(vehicle)}/>
  <>
    <table className="m-vehicle-work-info">
      <tbody className="m-vehicle-work-info__items">
        <TrNameValue name="run">{vehicle.runId ?? "N/A"}</TrNameValue>
        <TrNameValue name="vehicle">{vehicle.label ?? "N/A"}</TrNameValue>
        <TrNameValue name="operator">
          {/* {vehicle.operatorFirstName} {vehicle.operatorLastName} #{vehicle.operatorId} */}
          {[
            vehicle.operatorFirstName,
            vehicle.operatorLastName,
            vehicle.operatorId ? `#${vehicle.operatorId}` : null,
          ]
            .filter((e) => e !== null)
            .join(" ") || "Not Available"}
        </TrNameValue>
      </tbody>
    </table>
  </>
)
//#endregion

//#region Vehicle Location
const CurrentLocation = ({
  nearestIntersection,
}: {
  nearestIntersection: string | null
}): React.ReactElement => {
  const componentId = useId()
  return (
    <>
      <label
        className="m-current-location__label"
        htmlFor={"current-location-" + componentId}
      >
        Current Location
      </label>
      <output
        className="m-current-location__value "
        id={"current-location-" + componentId}
      >
        {nearestIntersection ?? "Exact location cannot be determined"}
      </output>
    </>
  )
}

const VehicleNearestIntersection = ({
  vehicle,
}: VehicleProp): React.ReactElement => {
  const nearestIntersection: string | null = useNearestIntersection(
    vehicle.latitude,
    vehicle.longitude
  )
  return (
    <div className="m-vehicle-nearest-intersection">
      <CurrentLocation nearestIntersection={nearestIntersection} />
    </div>
  )
}

const VehicleStreetViewButton = ({
  vehicle,
}: VehicleProp): React.ReactElement => (
  // <StreetViewButton position={vehicle as WorldPositionBearing} />
  <StreetViewButton
    title="Go to Street View"
    {...(vehicle as WorldPositionBearing)}
  />
)
//#endregion

//#region Vehicle Properties Card
const VehiclePropertiesCard = ({
  vehicle,
  onClose,
}: VehicleProp & {
  onClose: () => void
}): React.ReactElement => (
  <div className="m-vpc" title="Vehicle Properties Card">
    <div className="m-vpc__title-bar">
      <CloseButton2 onClick={onClose} closeButtonType={"l_light"} />

      <VehicleDataStaleTime vehicle={vehicle} />
    </div>

    <div className="m-vpc__summary">
      <VehicleRouteSummary vehicle={vehicle} />
    </div>

    <div className="m-vpc__body">
      <div className="m-vpc__properties m-info-section">
        <VehicleWorkInfo vehicle={vehicle} />
      </div>

      <div className="m-vpc__location-info m-info-section">
        <VehicleNearestIntersection vehicle={vehicle} />
        <VehicleStreetViewButton vehicle={vehicle} />
      </div>
    </div>
  </div>
)
export default VehiclePropertiesCard
//#endregion
