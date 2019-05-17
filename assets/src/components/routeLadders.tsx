import React from "react"
import {
  Route,
  TimepointsByRouteId,
  VehicleId,
  VehiclesByRouteId,
} from "../skate"
import RouteLadder from "./routeLadder"

interface Props {
  routes: Route[]
  timepointsByRouteId: TimepointsByRouteId
  vehiclesByRouteId: VehiclesByRouteId
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
        vehicles={vehiclesByRouteId[route.id] || []}
        selectedVehicleId={selectedVehicleId}
      />
    ))}
  </div>
)

export default RouteLadders
