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
import { directionName } from "../models/vehicle"
import { drawnStatus } from "../models/vehicleStatus"
import { VehicleOrGhost } from "../realtime"
import { RouteVariantName } from "./routeVariantName"
import { Size, VehicleIcon, vehicleOrientation } from "./vehicleIcon"
import { VisualSeparator } from "./visualSeparator"

interface VehicleOrGhostProp {
  vehicle: VehicleOrGhost
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

export type VehicleRouteSummaryEventProps = {
  onRouteVariantNameClicked?: MouseEventHandler<HTMLElement>
}

export type VehicleRouteSummaryProps = VehicleOrGhostProp &
  VehicleRouteSummaryEventProps

export const VehicleRouteSummary = ({
  vehicle,
  onRouteVariantNameClicked,
}: VehicleRouteSummaryProps): React.ReactElement => (
  <div className="c-vehicle-route-summary">
    <VehicleRouteDirection
      vehicle={vehicle}
      className="c-vehicle-route-summary__direction label font-xs-reg"
    />

    {onRouteVariantNameClicked ? (
      <button
        onClick={onRouteVariantNameClicked}
        className={joinClasses(
          [
            "c-vehicle-route-summary__route-variant",
            "c-vehicle-route-summary__route-variant--clickable",
            "headsign",
            "font-m-semi",
          ].flat()
        )}
      >
        <RouteVariantName vehicle={vehicle} />
      </button>
    ) : (
      <RouteVariantName
        vehicle={vehicle}
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
