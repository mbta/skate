import React, { useContext } from "react"
import { VehiclesByRouteIdContext } from "../contexts/vehiclesByRouteIdContext"
import { VehicleId, VehicleOrGhost } from "../realtime.d"
import { ByRouteId, Route, TimepointsByRouteId } from "../schedule.d"
import RouteLadder from "./routeLadder"

interface Props {
  routes: Route[]
  timepointsByRouteId: TimepointsByRouteId
  selectedVehicleId: VehicleId | undefined
}

const RouteLadders = ({
  routes,
  timepointsByRouteId,
  selectedVehicleId,
}: Props) => {
  const vehiclesByRouteId: ByRouteId<VehicleOrGhost[]> = useContext(
    VehiclesByRouteIdContext
  )

  return (
    <div className="m-route-ladders">
      {routes.map((route) => (
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
}

export default RouteLadders
