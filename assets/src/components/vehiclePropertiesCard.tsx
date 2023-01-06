import React, {
  ComponentPropsWithoutRef,
  MouseEventHandler,
  ReactNode,
  useId,
} from "react"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import { useNearestIntersection } from "../hooks/useNearestIntersection"
import { Vehicle } from "../realtime"
import { CloseButton } from "./closeButton"
import StreetViewButton, { WorldPositionBearing } from "./streetViewButton"
import { VehicleRouteSummary } from "./vehicleRouteSummary"

interface VehicleProp {
  vehicle: Vehicle
}

// #region Card Title Bar
const DataStaleTime = ({
  timestamp,
}: {
  timestamp: number
}): React.ReactElement => {
  const epochNowInSeconds = useCurrentTimeSeconds()
  return (
    <output
      aria-label="Time Since Last Update Received"
      className="data-stale-time label font-xs-reg"
    >
      Updated {epochNowInSeconds - timestamp} sec ago
    </output>
  )
}

const VehicleDataStaleTime = ({ vehicle }: VehicleProp): React.ReactElement => (
  <DataStaleTime timestamp={vehicle.timestamp} />
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
        className={[
          "kv-value font-s-reg",
          shouldMaskInfo(sensitive !== HideSensitiveInfo.None),
        ]
          .filter(Boolean)
          .join(" ")}
        aria-labelledby={id}
      >
        {value}
      </td>
    </tr>
  )
}

const VehicleWorkInfo = ({ vehicle }: VehicleProp): React.ReactElement => (
  <>
    <table className="m-vehicle-work-info">
      <tbody className="m-vehicle-work-info__items">
        <TrNameValue name="run">{vehicle.runId ?? "N/A"}</TrNameValue>
        <TrNameValue name="vehicle">{vehicle.label ?? "N/A"}</TrNameValue>
        <TrNameValue name="operator" sensitivity={HideSensitiveInfo.All}>
          {[
            vehicle.operatorFirstName,
            vehicle.operatorLastName,
            vehicle.operatorId ? `#${vehicle.operatorId}` : null,
          ]
            .filter((e) => e !== null)
            .join(" ") || "N/A"}
        </TrNameValue>
      </tbody>
    </table>
  </>
)
// #endregion

// #region Vehicle Location
const CurrentLocation = ({
  nearestIntersection,
}: {
  nearestIntersection?: string | null
}): React.ReactElement => {
  const id = `current-location-${useId()}`
  return (
    <>
      <label
        className="m-current-location__label label font-xs-reg title-case"
        htmlFor={id}
      >
        Current Location
      </label>
      <output className="m-current-location__value label font-s-semi" id={id}>
        {nearestIntersection ?? "Exact location cannot be determined"}
      </output>
    </>
  )
}

const VehicleNearestIntersection = ({
  vehicle,
}: VehicleProp): React.ReactElement => {
  const intersection = useNearestIntersection(
    vehicle.latitude,
    vehicle.longitude
  )

  return (
    <div className="m-current-location">
      <CurrentLocation nearestIntersection={intersection} />
    </div>
  )
}

// #endregion

// #region Vehicle Properties Card
// #region Catching Events Before Leaflet
const cancelEvent: MouseEventHandler<HTMLDivElement> = (e) => {
  e.stopPropagation()
  e.preventDefault()
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
}: VehicleProp & {
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

      <div className="m-vehicle-properties-card__location-info m-info-section">
        <VehicleNearestIntersection vehicle={vehicle} />
        <StreetViewButton
          aria-label="Go to Street View"
          {...(vehicle as WorldPositionBearing)}
        />
      </div>
    </div>
  </div>
)
export default VehiclePropertiesCard
// #endregion
