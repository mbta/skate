import React, {
  ComponentPropsWithoutRef,
  MouseEventHandler,
  ReactNode,
  useId,
} from "react"
import { joinTruthy, className as classNames } from "../helpers/dom"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import { useNearestIntersection } from "../hooks/useNearestIntersection"
import { isGhost, isVehicle } from "../models/vehicle"
import { Vehicle, VehicleOrGhost } from "../realtime"
import { CloseButton } from "./closeButton"
import StreetViewButton from "./streetViewButton"
import { VehicleRouteSummary } from "./vehicleRouteSummary"

interface VehicleProp {
  vehicle: Vehicle
}
interface VehicleOrGhostProp {
  vehicle: VehicleOrGhost
}

// #region Card Title Bar
const DataStaleTime = ({
  timestamp,
}: {
  timestamp: number
}): React.ReactElement => {
  const epochNowInSeconds = useCurrentTimeSeconds()
  return <>Updated {epochNowInSeconds - timestamp} sec ago</>
}

const VehicleDataStaleTime = ({
  vehicle,
}: VehicleOrGhostProp): React.ReactElement => (
  <output
    aria-label="Time Since Last Update Received"
    className="data-stale-time label font-xs-reg"
  >
    {isVehicle(vehicle) ? (
      <DataStaleTime timestamp={vehicle.timestamp} />
    ) : (
      <>Ghost bus or dropped trip</>
    )}
  </output>
)
// #endregion

// #region Vehicle Work Info
enum HideSensitiveInfo {
  All,
  Value,
  None,
}

// Table Row Name Value Pair Data
interface TrNameValueProps {
  name: string
  children: ReactNode
  idPrefix?: string
  sensitivity?: HideSensitiveInfo
}

const maskClass = "fs-mask"
const shouldMaskInfo = (value: boolean) => value && maskClass

// Table Row Name Value Pair
const TrNameValue = ({
  name,
  children: value,
  idPrefix,
  sensitivity: sensitive = HideSensitiveInfo.None,
}: TrNameValueProps): React.ReactElement => {
  const id = (idPrefix ?? name) + useId()
  return (
    <tr className={shouldMaskInfo(sensitive === HideSensitiveInfo.All) || ""}>
      <th className="kv-key font-s-semi" scope="row" id={id}>
        {name}
      </th>
      <td
        className={classNames([
          "kv-value font-s-reg",
          shouldMaskInfo(sensitive !== HideSensitiveInfo.None),
        ])}
        aria-labelledby={id}
      >
        {value}
      </td>
    </tr>
  )
}

const VehicleWorkInfo = ({
  vehicle,
}: VehicleOrGhostProp): React.ReactElement => (
  <>
    <table className="m-vehicle-work-info">
      <tbody className="m-vehicle-work-info__items">
        <TrNameValue name="run">{vehicle.runId || "N/A"}</TrNameValue>
        <TrNameValue name="vehicle">
          {(isVehicle(vehicle) && vehicle.label) || "N/A"}
        </TrNameValue>
        <TrNameValue name="operator" sensitivity={HideSensitiveInfo.All}>
          {(isVehicle(vehicle) &&
            joinTruthy([
              vehicle.operatorFirstName,
              vehicle.operatorLastName,
              vehicle.operatorId && `#${vehicle.operatorId}`,
            ])) ||
            "N/A"}
        </TrNameValue>
      </tbody>
    </table>
  </>
)
// #endregion

// #region Vehicle Location
const CurrentLocation = ({ vehicle }: VehicleProp): React.ReactElement => {
  const intersection = useNearestIntersection(
    vehicle.latitude,
    vehicle.longitude
  )
  return <>{intersection ?? "Exact location cannot be determined"}</>
}

const VehicleNearestIntersection = ({
  vehicle,
}: VehicleOrGhostProp): React.ReactElement => {
  const id = `current-location-${useId()}`
  return (
    <div className="m-current-location">
      <label
        className="m-current-location__label label font-xs-reg title-case"
        htmlFor={id}
      >
        Current Location
      </label>
      <output className="m-current-location__value label font-s-semi" id={id}>
        {isVehicle(vehicle) ? (
          <CurrentLocation vehicle={vehicle} />
        ) : (
          "Exact location cannot be determined"
        )}
      </output>
    </div>
  )
}

const VehicleLocationStreetViewButton = ({ vehicle }: { vehicle: Vehicle }) => (
  <StreetViewButton
    aria-label="Go to Street View"
    latitude={vehicle.latitude}
    longitude={vehicle.longitude}
    bearing={vehicle.bearing}
  />
)
// #endregion

// #region Vehicle Properties Card
// #region Catching Events Before Leaflet
const cancelEvent: MouseEventHandler<HTMLDivElement> = (e) => {
  e.stopPropagation()
}

const keepUserInputFromLeaflet: ComponentPropsWithoutRef<"div"> = {
  onMouseDownCapture: cancelEvent,
  onDoubleClickCapture: cancelEvent,
  onScrollCapture: cancelEvent,
  onWheelCapture: cancelEvent,
}
// #endregion

const VehiclePropertiesCard = ({
  vehicle,
  onClose,
}: VehicleOrGhostProp & {
  onClose: () => void
}): React.ReactElement => (
  <div
    {...keepUserInputFromLeaflet}
    className="m-vehicle-properties-card"
    aria-label="Vehicle Properties Card"
  >
    <div className="m-vehicle-properties-card__title-bar">
      <CloseButton
        onClick={onClose}
        closeButtonType={"l_light"}
        aria-label="Close Vehicle Properties Card"
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

      <div
        className="m-vehicle-properties-card__location-info m-info-section"
        hidden={isGhost(vehicle)}
      >
        <VehicleNearestIntersection vehicle={vehicle} />
        {isVehicle(vehicle) && (
          <VehicleLocationStreetViewButton vehicle={vehicle} />
        )}
      </div>
    </div>
  </div>
)
export default VehiclePropertiesCard
// #endregion
