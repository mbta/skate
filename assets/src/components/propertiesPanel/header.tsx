import React, { Dispatch, SetStateAction, useContext } from "react"
import { useRoute } from "../../contexts/routesContext"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { className } from "../../helpers/dom"
import vehicleLabel from "../../helpers/vehicleLabel"
import { secondsToMinutes } from "../../util/dateTime"
import { useCurrentTimeSeconds } from "../../hooks/useCurrentTime"
import {
  directionOnLadder,
  getLadderDirectionForRoute,
  LadderDirection,
  LadderDirections,
  VehicleDirection,
  emptyLadderDirectionsByRouteId,
} from "../../models/ladderDirection"
import { isVehicle } from "../../models/vehicle"
import {
  drawnStatus,
  humanReadableScheduleAdherence,
  statusClasses,
} from "../../models/vehicleStatus"
import { Vehicle, VehicleOrGhost } from "../../realtime"
import { Route } from "../../schedule"
import { deselectVehicle, returnToPreviousView } from "../../state"
import { RouteVariantName } from "../routeVariantName"
import VehicleIcon, { Orientation, Size } from "../vehicleIcon"
import TabList from "./tabList"
import { TabMode } from "./tabPanels"
import { currentRouteTab } from "../../models/routeTab"
import ViewHeader from "../viewHeader"

interface Props {
  vehicle: VehicleOrGhost
  tabMode: TabMode
  setTabMode: Dispatch<SetStateAction<TabMode>>
}

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

const ScheduleAdherence = ({ vehicle }: { vehicle: Vehicle }) => {
  const [{ userSettings }] = useContext(StateDispatchContext)

  return (
    <div
      className={`m-properties-panel__schedule-adherence ${className(
        statusClasses(drawnStatus(vehicle), userSettings.vehicleAdherenceColors)
      )}`}
    >
      <ScheduleAdherenceStatusIcon />
      <ScheduleAdherenceStatusString vehicle={vehicle} />
      <ScheduleAdherenceLabel vehicle={vehicle} />
    </div>
  )
}

const directionName = (
  { directionId }: VehicleOrGhost,
  route: Route | null
): string => (route ? route.directionNames[directionId] : "")

const Header = ({ vehicle, tabMode, setTabMode }: Props) => {
  const [{ routeTabs, userSettings, previousView }, dispatch] =
    useContext(StateDispatchContext)
  const epochNowInSeconds = useCurrentTimeSeconds()
  const route = useRoute(vehicle.routeId)

  const secondsAgo = (epochTime: number): string =>
    `${epochNowInSeconds - epochTime}s ago`

  const hideMe = () => dispatch(deselectVehicle())

  const vehicleIsShuttle = isVehicle(vehicle) && vehicle.isShuttle

  const currentTab = currentRouteTab(routeTabs)
  const ladderDirections = currentTab
    ? currentTab.ladderDirections
    : emptyLadderDirectionsByRouteId

  return (
    <div className="m-properties-panel__header-wrapper">
      <ViewHeader
        title="Vehicles"
        closeView={hideMe}
        backlinkToView={previousView}
        followBacklink={() => dispatch(returnToPreviousView())}
      />
      <div className="m-properties-panel__header">
        <div className="m-properties-panel__label">
          <VehicleIcon
            size={Size.Large}
            orientation={vehicleOrientation(vehicle, ladderDirections)}
            label={vehicleLabel(vehicle, userSettings)}
            variant={vehicle.viaVariant}
            status={drawnStatus(vehicle)}
            userSettings={userSettings}
          />
        </div>
        <div className="m-properties-panel__variant">
          <div className="m-properties-panel__inbound-outbound">
            {directionName(vehicle, route)}
          </div>

          <RouteVariantName vehicle={vehicle} />

          {isVehicle(vehicle) && !vehicle.isShuttle && (
            <ScheduleAdherence vehicle={vehicle} />
          )}
        </div>
        <div className="m-properties-panel__ping-container">
          {isVehicle(vehicle) && (
            <div className="m-properties-panel__last-gps-ping">
              {secondsAgo(vehicle.timestamp)}
            </div>
          )}
        </div>
      </div>
      {vehicleIsShuttle || (
        <TabList activeTab={tabMode} setActiveTab={setTabMode} />
      )}
    </div>
  )
}

export default Header
