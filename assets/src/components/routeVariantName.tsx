import React, { ComponentPropsWithoutRef } from "react"
import { useRoute } from "../contexts/routesContext"
import { joinClasses } from "../helpers/dom"
import {
  isActivelyPullingBack,
  isLoggedOut,
  isVehicle,
} from "../models/vehicle"
import { Ghost, Vehicle } from "../realtime"

export const RouteVariantName = ({
  vehicle,
  className,
  includePullbackInformation,
  ...props
}: {
  vehicle: Vehicle | Ghost
  includePullbackInformation?: boolean
} & ComponentPropsWithoutRef<"output">) => {
  const route = useRoute(vehicle.routeId)

  const { routeId, viaVariant, headsign } = vehicle
  const viaVariantFormatted = viaVariant && viaVariant !== "_" ? viaVariant : ""

  const isShuttle = isVehicle(vehicle) && vehicle.isShuttle

  return (
    <output
      aria-label="Route Variant Name"
      className={joinClasses(["c-route-variant-name", className])}
      {...props}
    >
      {isShuttle ? (
        "Shuttle"
      ) : isVehicle(vehicle) && isLoggedOut(vehicle) ? (
        "Logged Off"
      ) : includePullbackInformation &&
        isVehicle(vehicle) &&
        isActivelyPullingBack(vehicle) ? (
        <>{vehicle.pullbackPlaceName}</>
      ) : (
        <>
          <output
            aria-label="Route & Variant"
            className="c-route-variant-name__route-id"
          >
            {`${route?.name || routeId}_${viaVariantFormatted}`}
          </output>
          <span>
            {/* Underline does not work on this space unless it is inside of a span */}
            &nbsp;
          </span>
          <output
            aria-label="Headsign"
            className="c-route-variant-name__headsign"
          >
            {headsign}
          </output>
        </>
      )}
    </output>
  )
}
