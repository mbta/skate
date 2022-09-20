import React from "react"
import { useRoute } from "../contexts/routesContext"
import { isVehicle } from "../models/vehicle"
import { VehicleOrGhost } from "../realtime"

export const RouteVariantName = ({ vehicle }: { vehicle: VehicleOrGhost }) => {
  const route = useRoute(vehicle.routeId)
  if (isVehicle(vehicle) && vehicle.isShuttle) {
    return <div className="m-route-variant-name">Shuttle</div>
  }

  const { routeId, viaVariant, headsign } = vehicle
  const viaVariantFormatted = viaVariant && viaVariant !== "_" ? viaVariant : ""
  const headsignFormatted = headsign ? ` ${headsign}` : ""

  return (
    <div className="m-route-variant-name" data-testid="variant-name">
      <span className="m-route-variant-name__route-id">
        {`${route?.name || routeId}_${viaVariantFormatted}`}
      </span>
      {headsignFormatted}
    </div>
  )
}
