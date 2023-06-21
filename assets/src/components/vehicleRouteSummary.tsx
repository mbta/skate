import React, { ComponentPropsWithoutRef, useContext } from "react"
import { useRoute } from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import vehicleLabel from "../helpers/vehicleLabel"
import { emptyLadderDirectionsByRouteId } from "../models/ladderDirection"
import { currentRouteTab } from "../models/routeTab"
import { directionName } from "../models/vehicle"
import { drawnStatus } from "../models/vehicleStatus"
import { Ghost, Vehicle } from "../realtime"
import { RouteVariantName } from "./routeVariantName"
import { ScheduleAdherence } from "./scheduleAdherence"
import { Size, VehicleIcon, vehicleOrientation } from "./vehicleIcon"

interface VehicleOrGhostProp {
  vehicle: Vehicle | Ghost
}

// #endregion
// #region Vehicle Summary
export const VehicleStatusIcon = ({
  vehicle,
  className,
}: VehicleOrGhostProp &
  ComponentPropsWithoutRef<"div">): React.ReactElement => {
  const [{ routeTabs, userSettings }] = useContext(StateDispatchContext)
  const currentTab = currentRouteTab(routeTabs)
  const ladderDirections = currentTab
    ? currentTab.ladderDirections
    : emptyLadderDirectionsByRouteId

  return (
    <div className={className}>
      <VehicleIcon
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

export const VehicleRouteDirection = ({
  vehicle,
  className,
  ...props
}: VehicleOrGhostProp &
  ComponentPropsWithoutRef<"output">): React.ReactElement => {
  const route = useRoute(vehicle.routeId)
  return (
    <output
      aria-label="Route Direction"
      className={"c-vehicle-route-direction " + className}
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
  <img
    className={className ?? "c-visual-separator"}
    aria-hidden={true}
    role="img presentation"
    aria-label="presentation separator"
  />
)

export const VehicleRouteSummary = ({
  vehicle,
}: VehicleOrGhostProp): React.ReactElement => (
  <div className="c-vehicle-route-summary">
    <VehicleRouteDirection
      vehicle={vehicle}
      className="c-vehicle-route-summary__direction label font-xs-reg"
    />

    <RouteVariantName
      vehicle={vehicle}
      className="c-vehicle-route-summary__route-variant headsign font-m-semi"
    />

    <ScheduleAdherence
      vehicle={vehicle}
      title="Vehicle Schedule Adherence"
      className="c-vehicle-route-summary__adherence label font-xs-reg"
    />

    <VehicleStatusIcon
      vehicle={vehicle}
      className="c-vehicle-route-summary__icon"
    />

    <VisualSeparator className="c-vehicle-route-summary__separator" />
  </div>
)
