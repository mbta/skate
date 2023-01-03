import React, { ComponentPropsWithoutRef } from "react"
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

export const RouteVariantName2 = ({
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
      title="Route Variant Name"
      className={"m-route-variant-name " + className}
      {...props}
    >
      {isShuttle ? (
        "Shuttle"
      ) : (
        <>
          <output
            title="Route & Variant"
            className="m-route-variant-name__route-id"
          >
            {`${route?.name || routeId}_${viaVariantFormatted}`}
          </output>
          &nbsp;
          <output
            title="Route Headsign"
            className="m-route-variant-name__headsign"
          >
            {headsign}
          </output>
        </>
      )}
    </output>
  )
}
