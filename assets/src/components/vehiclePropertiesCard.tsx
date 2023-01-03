import React, {
  ComponentPropsWithoutRef,
  HTMLAttributes,
  ReactNode,
  useContext,
  useId,
} from "react"
import { useRoute } from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import vehicleLabel from "../helpers/vehicleLabel"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import { useNearestIntersection } from "../hooks/useNearestIntersection"
// import { useNearestIntersection2 } from "../hooks/useNearestIntersection"
import { emptyLadderDirectionsByRouteId } from "../models/ladderDirection"
import { currentRouteTab } from "../models/routeTab"
import { directionName } from "../models/vehicle"
import { drawnStatus } from "../models/vehicleStatus"
import { Vehicle } from "../realtime"
import { CloseButton2 } from "./closeButton"
import { RouteVariantName2 } from "./routeVariantName"
import { ScheduleAdherence } from "./scheduleAdherence"
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
    <output
      title="Time Since Last Update Received"
      className="data-stale-time label font-xs-reg"
    >
      Updated {epochNowInSeconds - timestamp} sec ago
    </output>
  )
}

const VehicleDataStaleTime = ({ vehicle }: VehicleProp): React.ReactElement => (
  <DataStaleTime timestamp={vehicle.timestamp} />
)
//#endregion

//#region Vehicle Summary

const VehicleIcon1 = ({
  vehicle,
  className,
}: VehicleProp & ComponentPropsWithoutRef<"div">): React.ReactElement => {
  const [{ routeTabs, userSettings }] = useContext(StateDispatchContext)
  const currentTab = currentRouteTab(routeTabs)
  const ladderDirections = currentTab
    ? currentTab.ladderDirections
    : emptyLadderDirectionsByRouteId

  return (
    <div className={className}>
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
  className,
  ...props
}: VehicleProp & HTMLAttributes<HTMLOutputElement>): React.ReactElement => {
  const route = useRoute(vehicle.routeId)
  return (
    <output
      title="Route Direction"
      className={"m-vehicle-route-direction " + className}
      {...props}
    >
      {directionName(vehicle, route)}
    </output>
  )
}

const VisualSeparator = ({
  className,
}: ComponentPropsWithoutRef<"object">): React.ReactElement => (
  // Visual accent to provide separation between elements
  // This object is strictly for visual presentation
  <object
    className={className ?? "m-visual-separator"}
    role="separator"
    aria-hidden={true}
    aria-label="presentation separator"
  />
)

const VehicleRouteSummary = ({ vehicle }: VehicleProp): React.ReactElement => (
  <div className="m-vehicle-route-summary">
    <VehicleIcon1
      vehicle={vehicle}
      className="m-vehicle-route-summary__icon" /* vehicle-label font-xl" */
    />

    <ScheduleAdherence
      vehicle={vehicle}
      title="Vehicle Schedule Adherence"
      className="m-vehicle-route-summary__adherence label font-xs-reg"
    />

    <VehicleRouteDirection
      vehicle={vehicle}
      className="m-vehicle-route-summary__direction label font-xs-reg"
    />

    <RouteVariantName2
      vehicle={vehicle}
      className="m-vehicle-route-summary__route-variant headsign font-m-semi"
    />

    <VisualSeparator className="m-vehicle-route-summary__separator" />
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
      <th className="kv-key font-s-semi" scope="row" id={id}>
        {name}
      </th>
      <td className="kv-value font-s-reg" aria-labelledby={id}>
        {value}
      </td>
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
  nearestIntersection?: string | null
}): React.ReactElement => {
  const componentId = useId()
  return (
    <>
      <label
        className="m-current-location__label label font-xs-reg title-case"
        htmlFor={"current-location-" + componentId}
      >
        Current Location
      </label>
      <output
        className="m-current-location__value label font-s-semi"
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
  // const { intersection, isPending } = useNearestIntersection2(
  //   vehicle.latitude,
  //   vehicle.longitude
  // )
  const intersection = useNearestIntersection(
    vehicle.latitude,
    vehicle.longitude
  )

  return (
    <div className="m-current-location">
      {/* <CurrentLocation nearestIntersection={isPending ? null : intersection} /> */}
      <CurrentLocation nearestIntersection={intersection} />
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
  <div className="m-vehicle-properties-card" title="Vehicle Properties Card">
    <div className="m-vehicle-properties-card__title-bar">
      <CloseButton2
        onClick={onClose}
        closeButtonType={"l_light"}
        title="Close Vehicle Properties Card"
      />

      <VehicleDataStaleTime vehicle={vehicle} />
    </div>

    <div className="m-vehicle-properties-card__summary">
      <VehicleRouteSummary vehicle={vehicle} />
    </div>

    <div className="m-vehicle-properties-card__body">
      <div className="m-vehicle-properties-card__properties m-info-section">
        <VehicleWorkInfo vehicle={vehicle} />
      </div>

      <div className="m-vehicle-properties-card__location-info m-info-section">
        <VehicleNearestIntersection vehicle={vehicle} />
        <VehicleStreetViewButton vehicle={vehicle} />
      </div>
    </div>
  </div>
)
export default VehiclePropertiesCard
//#endregion
