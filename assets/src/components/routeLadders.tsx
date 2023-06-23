import React, { useContext, useRef, WheelEventHandler } from "react"
import { VehiclesByRouteIdContext } from "../contexts/vehiclesByRouteIdContext"
import { VehicleId, VehicleInScheduledService, Ghost } from "../realtime.d"
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
  routesWithAlerts: RouteId[]
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
  routesWithAlerts,
}: Props) => {
  const vehiclesByRouteId: ByRouteId<(VehicleInScheduledService | Ghost)[]> =
    useContext(VehiclesByRouteIdContext)
  const laddersRef = useRef<HTMLDivElement | null>(null)
  const onWheel: WheelEventHandler<HTMLDivElement> = (e) => {
    if (laddersRef.current !== null) {
      laddersRef.current.scrollTo({
        top: 0,
        left: laddersRef.current.scrollLeft + e.deltaY,
      })
    }
  }

  return (
    <div
      className="c-route-ladders"
      ref={laddersRef}
      onWheel={onWheel}
      data-testid="route-ladders-div"
    >
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
          hasAlert={routesWithAlerts.includes(route.id)}
        />
      ))}
    </div>
  )
}

export default RouteLadders
