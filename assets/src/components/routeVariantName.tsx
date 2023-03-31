import React, { ComponentPropsWithoutRef } from "react"
import { useRoute } from "../contexts/routesContext"
import { joinClasses } from "../helpers/dom"
import { isVehicle } from "../models/vehicle"
import { VehicleOrGhost } from "../realtime"

export const RouteVariantName = ({
  vehicle,
  className,
  ...props
}: { vehicle: VehicleOrGhost } & ComponentPropsWithoutRef<"output">) => {
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
      ) : (
        <>
          <output
            aria-label="Route & Variant"
            className="c-route-variant-name__route-id"
          >
            {`${route?.name || routeId}_${viaVariantFormatted}`}
          </output>
          &nbsp;
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
