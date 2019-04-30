import React from "react"
import { Route, TimepointsByRouteId, VehiclesByRouteId } from "../skate"
import RouteLadder from "./routeLadder"

interface Props {
  routes: Route[]
  timepointsByRouteId: TimepointsByRouteId
  vehiclesByRouteId: VehiclesByRouteId
}

const RouteLadders = ({
  routes,
  timepointsByRouteId,
  vehiclesByRouteId,
}: Props) => (
  <div className="m-route-ladders">
    {routes.map(route => (
      <RouteLadder
        key={route.id}
        route={route}
        timepoints={timepointsByRouteId[route.id]}
        vehicles={vehiclesByRouteId[route.id] || []}
      />
    ))}
  </div>
)

export default RouteLadders
