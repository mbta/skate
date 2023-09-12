import React, {
  ComponentPropsWithoutRef,
  MouseEventHandler,
  useContext,
} from "react"
import { useRoute } from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { joinClasses } from "../helpers/dom"
import vehicleLabel from "../helpers/vehicleLabel"
import { emptyLadderDirectionsByRouteId } from "../models/ladderDirection"
import { currentRouteTab } from "../models/routeTab"
import {
  directionName,
  isActivelyPullingBack,
  isLoggedOut,
  isVehicle,
} from "../models/vehicle"
import { drawnStatus } from "../models/vehicleStatus"
import { Ghost, Vehicle } from "../realtime"
import { RouteVariantName } from "./routeVariantName"
import { Size, VehicleIcon, vehicleOrientation } from "./vehicleIcon"
import { VisualSeparator } from "./visualSeparator"

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
  includePullbackInformation,
  ...props
}: VehicleOrGhostProp &
  IncludePullbackInformationType &
  ComponentPropsWithoutRef<"output">): React.ReactElement => {
  const route = useRoute(vehicle.routeId)
  return (
    <output
      aria-label="Route Direction"
      className={"c-vehicle-route-direction " + className}
      {...props}
    >
      {isVehicle(vehicle) && isLoggedOut(vehicle)
        ? "No direction available"
        : includePullbackInformation &&
          isVehicle(vehicle) &&
          isActivelyPullingBack(vehicle)
        ? "Pulling back"
        : directionName(vehicle, route)}
    </output>
  )
}

export type VehicleRouteSummaryEventProps = {
  onRouteVariantNameClicked?: MouseEventHandler<HTMLElement>
}

export type IncludePullbackInformationType = {
  includePullbackInformation?: boolean
}

export type VehicleRouteSummaryProps = VehicleOrGhostProp &
  VehicleRouteSummaryEventProps &
  IncludePullbackInformationType

export const VehicleRouteSummary = ({
  vehicle,
  onRouteVariantNameClicked,
  includePullbackInformation,
}: VehicleRouteSummaryProps): React.ReactElement => (
  <div className="c-vehicle-route-summary">
    <VehicleRouteDirection
      vehicle={vehicle}
      className="c-vehicle-route-summary__direction label font-xs-reg"
      includePullbackInformation={includePullbackInformation}
    />

    {onRouteVariantNameClicked &&
    !(isVehicle(vehicle) && isActivelyPullingBack(vehicle)) ? (
      <button
        onClick={onRouteVariantNameClicked}
        className={joinClasses([
          "c-vehicle-route-summary__route-variant",
          "c-vehicle-route-summary__route-variant--clickable",
          "headsign",
          "font-m-semi",
        ])}
      >
        <RouteVariantName
          vehicle={vehicle}
          includePullbackInformation={includePullbackInformation}
        />
      </button>
    ) : (
      <RouteVariantName
        vehicle={vehicle}
        includePullbackInformation={includePullbackInformation}
        className="c-vehicle-route-summary__route-variant headsign font-m-semi"
      />
    )}

    <VehicleStatusIcon
      vehicle={vehicle}
      className="c-vehicle-route-summary__icon"
    />

    <VisualSeparator className="c-vehicle-route-summary__separator" />
  </div>
)
