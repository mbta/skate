import React, { Dispatch, SetStateAction, useContext } from "react"
import { useRoute } from "../../contexts/routesContext"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { joinClasses } from "../../helpers/dom"
import vehicleLabel from "../../helpers/vehicleLabel"
import { secondsAgoLabel, secondsToMinutes } from "../../util/dateTime"
import { useCurrentTimeSeconds } from "../../hooks/useCurrentTime"
import { emptyLadderDirectionsByRouteId } from "../../models/ladderDirection"
import {
  directionName,
  isVehicle,
  isVehicleInScheduledService,
} from "../../models/vehicle"
import {
  drawnStatus,
  humanReadableScheduleAdherence,
  statusClasses,
} from "../../models/vehicleStatus"
import { Ghost, Vehicle, VehicleInScheduledService } from "../../realtime"
import { closeView, returnToPreviousView } from "../../state"
import { RouteVariantName } from "../routeVariantName"
import VehicleIcon, { Size, vehicleOrientation } from "../vehicleIcon"
import TabList from "./tabList"
import { TabMode } from "./tabPanels"
import { currentRouteTab } from "../../models/routeTab"
import ViewHeader from "../viewHeader"

interface Props {
  vehicle: Vehicle | Ghost
  tabMode: TabMode
  setTabMode: Dispatch<SetStateAction<TabMode>>
}

const ScheduleAdherenceStatusIcon = () => (
  <div className="c-properties-panel__schedule-adherence-status-icon">
    <svg width="10" height="10">
      <circle cx="5" cy="5" r="5" />
    </svg>
  </div>
)

const ScheduleAdherenceStatusString = ({
  vehicle,
}: {
  vehicle: VehicleInScheduledService
}) => (
  <div className="c-properties-panel__schedule-adherence-status-string">
    {humanReadableScheduleAdherence(vehicle)}
  </div>
)

const earlyOrLate = (scheduleAdherenceSecs: number): string =>
  scheduleAdherenceSecs <= 0 ? "early" : "late"

export const scheduleAdherenceLabelString = (
  scheduleAdherenceSecs: number
): string =>
  `${secondsToMinutes(scheduleAdherenceSecs)} min ${earlyOrLate(
    scheduleAdherenceSecs
  )}`

const ScheduleAdherenceLabel = ({
  vehicle,
}: {
  vehicle: VehicleInScheduledService
}) => (
  <div className="c-properties-panel__schedule-adherence-label">
    {vehicle.isOffCourse || vehicle.scheduleAdherenceSecs === null
      ? ""
      : `(${scheduleAdherenceLabelString(vehicle.scheduleAdherenceSecs)})`}
  </div>
)

const ScheduleAdherence = ({
  vehicle,
}: {
  vehicle: VehicleInScheduledService
}) => {
  const [{ userSettings }] = useContext(StateDispatchContext)

  return (
    <div
      className={`c-properties-panel__schedule-adherence ${joinClasses(
        statusClasses(drawnStatus(vehicle), userSettings.vehicleAdherenceColors)
      )}`}
    >
      <ScheduleAdherenceStatusIcon />
      <ScheduleAdherenceStatusString vehicle={vehicle} />
      <ScheduleAdherenceLabel vehicle={vehicle} />
    </div>
  )
}

const Header = ({ vehicle, tabMode, setTabMode }: Props) => {
  const [{ routeTabs, userSettings, previousView }, dispatch] =
    useContext(StateDispatchContext)
  const epochNowInSeconds = useCurrentTimeSeconds()
  const route = useRoute(vehicle.routeId)

  const hideMe = () => dispatch(closeView())

  const vehicleIsShuttle = isVehicle(vehicle) && vehicle.isShuttle

  const currentTab = currentRouteTab(routeTabs)
  const ladderDirections = currentTab
    ? currentTab.ladderDirections
    : emptyLadderDirectionsByRouteId

  return (
    <div className="c-properties-panel__header-wrapper">
      <ViewHeader
        title="Vehicles"
        closeView={hideMe}
        backlinkToView={previousView}
        followBacklink={() => dispatch(returnToPreviousView())}
      />
      <div className="c-properties-panel__header">
        <div className="c-properties-panel__label">
          <VehicleIcon
            size={Size.Large}
            orientation={vehicleOrientation(vehicle, ladderDirections)}
            label={vehicleLabel(vehicle, userSettings)}
            variant={vehicle.viaVariant}
            status={drawnStatus(vehicle)}
            userSettings={userSettings}
          />
        </div>
        <div className="c-properties-panel__variant">
          <div className="c-properties-panel__inbound-outbound">
            {directionName(vehicle, route)}
          </div>

          <RouteVariantName vehicle={vehicle} />

          {isVehicleInScheduledService(vehicle) && !vehicle.isShuttle && (
            <ScheduleAdherence vehicle={vehicle} />
          )}
        </div>
        <div className="c-properties-panel__ping-container">
          {isVehicle(vehicle) && (
            <div className="c-properties-panel__last-gps-ping">
              {secondsAgoLabel(epochNowInSeconds, vehicle.timestamp)}
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
