import React, { ReactNode, useId } from "react"
import { joinTruthy, joinClasses } from "../../helpers/dom"
import { useCurrentTimeSeconds } from "../../hooks/useCurrentTime"
import { useNearestIntersection } from "../../hooks/useNearestIntersection"
import { isGhost, isLoggedOut, isVehicle } from "../../models/vehicle"
import { Ghost, Vehicle } from "../../realtime"
import { formattedDate, formattedTime } from "../../util/dateTime"
import { isLoading, isOk } from "../../util/fetchResult"
import Loading from "../loading"
import StreetViewButton from "../streetViewButton"
import {
  VehicleRouteSummary,
  VehicleRouteSummaryEventProps,
} from "../vehicleRouteSummary"
import { ScheduleAdherence } from "../scheduleAdherence"
import inTestGroup, { TestGroups } from "../../userInTestGroup"

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
        {value}
      </td>
    </tr>
  )
}

const VehicleWorkInfo = ({
  vehicleOrGhost,
}: VehicleOrGhostProp): React.ReactElement => {
  const isLoggedOutVehicle =
    isVehicle(vehicleOrGhost) && isLoggedOut(vehicleOrGhost)
  const noRunText = isLoggedOutVehicle ? "No run logged in" : "N/A"
  const noOperatorText = isLoggedOutVehicle ? "No operator logged in" : "N/A"

  return (
    <>
      <table className="c-vehicle-work-info">
        <tbody className="c-vehicle-work-info__items">
          <TrNameValue name="run">
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
  const intersection = useNearestIntersection(
    vehicle.latitude,
    vehicle.longitude
  )

  if (isLoading(intersection) && !isOk(intersection)) {
    return <Loading />
  } else if (isOk(intersection)) {
    return <>{intersection.ok}</>
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
export type VehiclePropertiesCardProps = VehicleOrGhostProp &
  VehicleRouteSummaryEventProps

const VehiclePropertiesCard = ({
  vehicleOrGhost,
  onRouteVariantNameClicked,
}: VehiclePropertiesCardProps): React.ReactElement => {
  const includePullbackInformation = inTestGroup(TestGroups.PullBackMapLayer)

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
          includePullbackInformation={includePullbackInformation}
        />
      </div>

      <div className="c-vehicle-properties-card__summary">
        <VehicleRouteSummary
          vehicle={vehicleOrGhost}
          onRouteVariantNameClicked={onRouteVariantNameClicked}
          includePullbackInformation={includePullbackInformation}
        />
      </div>

      <div className="c-vehicle-properties-card__body">
        <div className="c-vehicle-properties-card__properties c-vehicle-properties-card__info-section">
          <VehicleWorkInfo vehicleOrGhost={vehicleOrGhost} />
        </div>

        <div
          className="c-vehicle-properties-card__location-info c-vehicle-properties-card__info-section"
          hidden={isGhost(vehicleOrGhost)}
        >
          <VehicleNearestIntersection vehicleOrGhost={vehicleOrGhost} />
          {isVehicle(vehicleOrGhost) && (
            <VehicleLocationStreetViewButton vehicle={vehicleOrGhost} />
          )}
        </div>
      </div>
    </div>
  )
}
export default VehiclePropertiesCard
// #endregion
