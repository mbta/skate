import React, { Dispatch, SetStateAction, useContext, useState } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import vehicleLabel from "../../helpers/vehicleLabel"
import useInterval from "../../hooks/useInterval"
import {
  directionOnLadder,
  getLadderDirectionForRoute,
  LadderDirection,
  LadderDirections,
  VehicleDirection,
} from "../../models/ladderDirection"
import { isVehicle, shouldShowHeadwayDiagram } from "../../models/vehicle"
import {
  drawnStatus,
  humanReadableScheduleAdherence,
  statusClass,
} from "../../models/vehicleStatus"
import { Vehicle, VehicleOrGhost } from "../../realtime"
import { Route } from "../../schedule"
import { deselectVehicle } from "../../state"
import CloseButton from "../closeButton"
import { RouteVariantName } from "../routeVariantName"
import VehicleIcon, { Orientation, Size } from "../vehicleIcon"
import { TabMode } from "./tabPanels"

interface Props {
  vehicle: VehicleOrGhost
  route?: Route
  tabMode: TabMode
  setTabMode: Dispatch<SetStateAction<TabMode>>
}

const TabStatusIcon = () => (
  <svg className="m-tabs__tab-status-icon" width="14" height="14">
    <circle
      className="m-tabs__tab-status-icon-outer-circle"
      cx="7"
      cy="7"
      r="6"
    />
    <circle
      className="m-tabs__tab-status-icon-inner-circle"
      cx="7"
      cy="7"
      r="4"
    />
  </svg>
)

const vehicleOrientation = (
  vehicle: VehicleOrGhost,
  ladderDirections: LadderDirections
): Orientation => {
  if (vehicle.routeId !== null && vehicle.directionId !== null) {
    const ladderDirection: LadderDirection = getLadderDirectionForRoute(
      ladderDirections,
      vehicle.routeId
    )
    const vehicleDirection: VehicleDirection = directionOnLadder(
      vehicle.directionId,
      ladderDirection
    )

    if (vehicle.routeStatus === "laying_over") {
      return vehicleDirection === VehicleDirection.Down
        ? Orientation.Left
        : Orientation.Right
    } else {
      return vehicleDirection === VehicleDirection.Down
        ? Orientation.Down
        : Orientation.Up
    }
  } else {
    return Orientation.Up
  }
}

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
  <div className="m-properties-panel__schedule-adherence-label">
    {vehicle.isOffCourse ? "" : scheduleAdherenceLabelString(vehicle)}
  </div>
)

const ScheduleAdherence = ({ vehicle }: { vehicle: Vehicle }) => (
  <div
    className={`m-properties-panel__schedule-adherence ${statusClass(
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
  <div className="m-properties-panel__headway-target">
    <span className="m-properties-panel__headway-target-label">
      HEADWAY TARGET
    </span>
    <span className="m-properties-panel__headway-target-value">
      {minutes(scheduledHeadwaySecs)} min
    </span>
  </div>
)

const directionName = (
  { directionId }: VehicleOrGhost,
  route?: Route
): string => (route ? route.directionNames[directionId] : "")

const nowInSeconds = (): number => Math.floor(Date.now() / 1000)

const Tab = ({
  tabName,
  activeTab,
  setActiveTab,
}: {
  tabName: TabMode
  activeTab: TabMode
  setActiveTab: Dispatch<SetStateAction<TabMode>>
}) => {
  const classes =
    tabName === activeTab ? "m-tabs__tab m-tabs__tab--selected" : "m-tabs__tab"

  const tabTitle = tabName[0].toUpperCase() + tabName.slice(1)
  const clickCallback = () => setActiveTab(tabName)

  return (
    <li className={classes} onClick={clickCallback}>
      <TabStatusIcon />
      {tabTitle}
    </li>
  )
}

const Header = ({ vehicle, route, tabMode, setTabMode }: Props) => {
  const [{ ladderDirections, settings }, dispatch] = useContext(
    StateDispatchContext
  )
  const [epocNowInSeconds, setEpocNowInSeconds] = useState(nowInSeconds())
  useInterval(() => setEpocNowInSeconds(nowInSeconds()), 1000)

  const secondsAgo = (epocTime: number): string =>
    `${epocNowInSeconds - epocTime}s ago`

  const hideMe = () => dispatch(deselectVehicle())

  return (
    <div className="m-properties-panel__header-wrapper">
      {" "}
      <div className="m-properties-panel__header">
        <div className="m-properties-panel__label">
          <VehicleIcon
            size={Size.Large}
            orientation={vehicleOrientation(vehicle, ladderDirections)}
            label={vehicleLabel(vehicle, settings)}
            variant={vehicle.viaVariant}
            status={drawnStatus(vehicle)}
          />
        </div>
        <div className="m-properties-panel__variant">
          <div className="m-properties-panel__inbound-outbound">
            {directionName(vehicle, route)}
          </div>

          <RouteVariantName vehicle={vehicle} />

          {isVehicle(vehicle) && shouldShowHeadwayDiagram(vehicle) ? (
            <HeadwayTarget vehicle={vehicle} />
          ) : (
            isVehicle(vehicle) &&
            !vehicle.isShuttle && <ScheduleAdherence vehicle={vehicle} />
          )}
        </div>
        <div className="m-properties-panel__close-ping">
          <CloseButton onClick={hideMe} />

          {isVehicle(vehicle) && (
            <div className="m-properties-panel__last-gps-ping">
              {secondsAgo(vehicle.timestamp)}
            </div>
          )}
        </div>
      </div>{" "}
      <ul className="m-tabs__tab-list">
        <Tab tabName="status" activeTab={tabMode} setActiveTab={setTabMode} />
        <Tab tabName="run" activeTab={tabMode} setActiveTab={setTabMode} />
        <Tab tabName="block" activeTab={tabMode} setActiveTab={setTabMode} />
      </ul>
    </div>
  )
}

export default Header
