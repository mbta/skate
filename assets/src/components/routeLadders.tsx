import React, { useContext } from "react"
import { VehiclesByRouteIdContext } from "../contexts/vehiclesByRouteIdContext"
import { VehicleId, VehicleOrGhost } from "../realtime.d"
import { ByRouteId, Route, TimepointsByRouteId, RouteId } from "../schedule.d"
import RouteLadder from "./routeLadder"
import { LadderDirections } from "../models/ladderDirection"
import { LadderCrowdingToggles } from "../models/ladderCrowdingToggle"

interface Props {
  routes: Route[]
  timepointsByRouteId: TimepointsByRouteId
  selectedVehicleId: VehicleId | undefined
  deselectRoute: (routeId: RouteId) => void
  reverseLadder: (routeId: RouteId) => void
  toggleCrowding: (routeId: RouteId) => void
  ladderDirections: LadderDirections
  ladderCrowdingToggles: LadderCrowdingToggles
}

const RouteLadders = ({
  routes,
  timepointsByRouteId,
  selectedVehicleId,
  deselectRoute,
  reverseLadder,
  toggleCrowding,
  ladderDirections,
  ladderCrowdingToggles,
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
          deselectRoute={deselectRoute}
          reverseLadder={reverseLadder}
          toggleCrowding={toggleCrowding}
          ladderDirections={ladderDirections}
          ladderCrowdingToggles={ladderCrowdingToggles}
        />
      ))}
    </div>
  )
}

export default RouteLadders
