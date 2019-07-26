import React from "react"
import {
  ByRouteId,
  Route,
  TimepointsByRouteId,
  VehicleId,
  VehiclesForRoute,
} from "../skate"
import RouteLadder from "./routeLadder"

interface Props {
  routes: Route[]
  timepointsByRouteId: TimepointsByRouteId
  vehiclesByRouteId: ByRouteId<VehiclesForRoute>
  selectedVehicleId: VehicleId | undefined
}

const RouteLadders = ({
  routes,
  timepointsByRouteId,
  vehiclesByRouteId,
  selectedVehicleId,
}: Props) => (
  <div className="m-route-ladders">
    {routes.map(route => (
      <RouteLadder
        key={route.id}
        route={route}
        timepoints={timepointsByRouteId[route.id]}
        vehiclesForRoute={vehiclesByRouteId[route.id] || null}
        selectedVehicleId={selectedVehicleId}
      />
    ))}
  </div>
)

export default RouteLadders
