import React, { ReactNode, useId } from "react"
import { joinTruthy, joinClasses } from "../../helpers/dom"
import { useCurrentTimeSeconds } from "../../hooks/useCurrentTime"
import { useNearestIntersection } from "../../hooks/useNearestIntersection"
import { isGhost, isLoggedOut, isVehicle } from "../../models/vehicle"
import { Ghost, Vehicle } from "../../realtime"
import { formattedDate, formattedTime } from "../../util/dateTime"
import Loading from "../loading"
import {
  VehicleRouteSummary,
  VehicleRouteSummaryEventProps,
} from "../vehicleRouteSummary"
import { ScheduleAdherence } from "../scheduleAdherence"
import { DirectionsButton } from "../directionsButton"
import { isLoading } from "../../hooks/useApiCall"

const maxAgeToShowInSeconds = 5 * 60

interface VehicleProp {
  vehicle: Vehicle
}
interface VehicleOrGhostProp {
  vehicleOrGhost: Vehicle | Ghost
}

// #region Card Title Bar
const DataStaleTime = ({
  timestamp,
}: {
  timestamp: number
}): React.ReactElement => {
  const epochNowInSeconds = useCurrentTimeSeconds()
  const age = epochNowInSeconds - timestamp

  if (age <= maxAgeToShowInSeconds) {
    return <>Updated {age} sec ago</>
  } else {
    const date = new Date(timestamp * 1000)
    return (
      <>
        Updated at {formattedTime(date)}; {formattedDate(date)}
      </>
    )
  }
}

const VehicleDataStaleTime = ({
  vehicleOrGhost,
}: VehicleOrGhostProp): React.ReactElement => (
  <output
    aria-label="Time Since Last Update Received"
    className="data-stale-time label font-xs-reg"
  >
    {isVehicle(vehicleOrGhost) ? (
      <DataStaleTime timestamp={vehicleOrGhost.timestamp} />
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
  onValueClick?: () => void
}

const maskClass = "fs-mask"
const shouldMaskInfo = (value: boolean) => value && maskClass

// Table Row Name Value Pair
const TrNameValue = ({
  name,
  children: value,
  idPrefix,
  sensitivity: sensitive = HideSensitiveInfo.None,
  onValueClick,
}: TrNameValueProps): React.ReactElement => {
  const id = (idPrefix ?? name) + useId()
  return (
    <tr
      className={
        shouldMaskInfo(sensitive === HideSensitiveInfo.All) || undefined
      }
    >
      <th className="kv-key font-s-semi" scope="row" id={id}>
        {name}
      </th>
      <td
        className={joinClasses([
          "kv-value font-s-reg",
          shouldMaskInfo(sensitive !== HideSensitiveInfo.None),
        ])}
        aria-labelledby={id}
      >
        {onValueClick ? (
          <button className="kv-value--clickable" onClick={onValueClick}>
            {value}
          </button>
        ) : (
          <>{value}</>
        )}
      </td>
    </tr>
  )
}

type VehicleWorkInfoEventProps = {
  onRunClick?: (vehicleOrGhost: Vehicle | Ghost) => void
}

type VehicleWorkInfoProps = VehicleOrGhostProp & VehicleWorkInfoEventProps

const VehicleWorkInfo = ({
  vehicleOrGhost,
  onRunClick,
}: VehicleWorkInfoProps): React.ReactElement => {
  const isLoggedOutVehicle =
    isVehicle(vehicleOrGhost) && isLoggedOut(vehicleOrGhost)
  const noRunText = isLoggedOutVehicle ? "No run logged in" : "N/A"
  const noOperatorText = isLoggedOutVehicle ? "No operator logged in" : "N/A"

  return (
    <>
      <table className="c-vehicle-work-info">
        <tbody className="c-vehicle-work-info__items">
          <TrNameValue
            name="run"
            onValueClick={onRunClick && (() => onRunClick(vehicleOrGhost))}
          >
            {vehicleOrGhost.runId || noRunText}
          </TrNameValue>
          <TrNameValue name="vehicle">
            {(isVehicle(vehicleOrGhost) && vehicleOrGhost.label) || "N/A"}
          </TrNameValue>
          <TrNameValue name="operator" sensitivity={HideSensitiveInfo.Value}>
            {(isVehicle(vehicleOrGhost) &&
              joinTruthy([
                vehicleOrGhost.operatorFirstName,
                vehicleOrGhost.operatorLastName,
                vehicleOrGhost.operatorId && `#${vehicleOrGhost.operatorId}`,
              ])) ||
              noOperatorText}
          </TrNameValue>
        </tbody>
      </table>
    </>
  )
}
// #endregion

// #region Vehicle Location
const CurrentLocation = ({ vehicle }: VehicleProp): React.ReactElement => {
  const intersection = useNearestIntersection({lat: vehicle.latitude, lon: vehicle.longitude})

  if (isLoading(intersection) && !intersection.result) {
    return <Loading />
  } else if (intersection.result) {
    return <>{intersection.result}</>
  }

  return <>Exact location cannot be determined</>
}

const VehicleNearestIntersection = ({
  vehicleOrGhost,
}: VehicleOrGhostProp): React.ReactElement => {
  const id = `current-location-${useId()}`
  return (
    <div className="c-current-location">
      <label
        className="c-current-location__label label font-xs-reg title-case"
        htmlFor={id}
      >
        Current Location
      </label>
      <output className="c-current-location__value label font-s-semi" id={id}>
        {isVehicle(vehicleOrGhost) ? (
          <CurrentLocation vehicle={vehicleOrGhost} />
        ) : (
          "Exact location cannot be determined"
        )}
      </output>
    </div>
  )
}

const VehicleLocationDirectionsButton = ({ vehicle }: { vehicle: Vehicle }) => (
  <DirectionsButton latitude={vehicle.latitude} longitude={vehicle.longitude} />
)
// #endregion

// #region Vehicle Properties Card
export type VehiclePropertiesCardProps = VehicleOrGhostProp &
  VehicleRouteSummaryEventProps &
  VehicleWorkInfoEventProps

const VehiclePropertiesCard = ({
  vehicleOrGhost,
  onRouteVariantNameClicked,
  onRunClick,
}: VehiclePropertiesCardProps): React.ReactElement => {
  return (
    <div
      className="c-vehicle-properties-card"
      aria-label="Vehicle Properties Card"
    >
      <div className="c-vehicle-properties-card__title-bar">
        <VehicleDataStaleTime vehicleOrGhost={vehicleOrGhost} />
        <ScheduleAdherence
          vehicle={vehicleOrGhost}
          title="Vehicle Schedule Adherence"
          className="label font-xs-reg"
          includePullbackInformation={true}
        />
      </div>

      <div className="c-vehicle-properties-card__summary">
        <VehicleRouteSummary
          vehicle={vehicleOrGhost}
          onRouteVariantNameClicked={onRouteVariantNameClicked}
          includePullbackInformation={true}
        />
      </div>

      <div className="c-vehicle-properties-card__body">
        <div className="c-vehicle-properties-card__properties c-vehicle-properties-card__info-section">
          <VehicleWorkInfo
            vehicleOrGhost={vehicleOrGhost}
            onRunClick={onRunClick}
          />
        </div>

        <div
          className="c-vehicle-properties-card__location-info c-vehicle-properties-card__info-section"
          hidden={isGhost(vehicleOrGhost)}
        >
          <VehicleNearestIntersection vehicleOrGhost={vehicleOrGhost} />
          {isVehicle(vehicleOrGhost) && (
            <VehicleLocationDirectionsButton vehicle={vehicleOrGhost} />
          )}
        </div>
      </div>
    </div>
  )
}
export default VehiclePropertiesCard
// #endregion
