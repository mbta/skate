import React from "react"
import { VehicleId, VehicleOrGhost } from "../realtime.d"
import { ByRouteId, Route, TimepointsByRouteId } from "../schedule.d"
import RouteLadder from "./routeLadder"

interface Props {
  routes: Route[]
  timepointsByRouteId: TimepointsByRouteId
  vehiclesByRouteId: ByRouteId<VehicleOrGhost[]>
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
        vehiclesAndGhosts={vehiclesByRouteId[route.id]}
        selectedVehicleId={selectedVehicleId}
      />
    ))}
  </div>
)

export default RouteLadders
