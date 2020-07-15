import React from "react"
import { isVehicle } from "../models/vehicle"
import { VehicleOrGhost } from "../realtime"
import { Route } from "../schedule"
import { routeNameOrId } from "../util/route"

export const RouteVariantName = ({
  vehicle,
  routes,
}: {
  vehicle: VehicleOrGhost
  routes: Route[] | null
}) => {
  if (isVehicle(vehicle) && vehicle.isShuttle) {
    return <div className="m-route-variant-name">Shuttle</div>
  }

  const { routeId, viaVariant, headsign } = vehicle
  const viaVariantFormatted = viaVariant && viaVariant !== "_" ? viaVariant : ""
  const headsignFormatted = headsign ? ` ${headsign}` : ""

  return (
    <div className="m-route-variant-name">
      <span className="m-route-variant-name__route-id">
        {`${routeNameOrId(routeId, routes)}_${viaVariantFormatted}`}
      </span>
      {headsignFormatted}
    </div>
  )
}
