import React, { useContext, useRef, WheelEventHandler } from "react"
import { VehiclesByRouteIdContext } from "../contexts/vehiclesByRouteIdContext"
import { VehicleId, VehicleInScheduledService, Ghost } from "../realtime"
import { ByRouteId, Route, TimepointsByRouteId, RouteId } from "../schedule.d"
import RouteLadder from "./routeLadder"
import { LadderDirections } from "../models/ladderDirection"
import { LadderCrowdingToggles } from "../models/ladderCrowdingToggle"
import RoutesContext from "../contexts/routesContext"
import useTimepoints from "../hooks/useTimepoints"
import { SocketContext } from "../contexts/socketContext"
import useAlerts from "../hooks/useAlerts"
import { DetoursMap, useActiveDetours } from "../hooks/useDetours"
import { DetourId, SimpleDetour } from "../models/detoursList"
import inTestGroup, { TestGroups } from "../userInTestGroup"

export const findRouteById = (
  routes: Route[] | null,
  routeId: RouteId
): Route | undefined => (routes || []).find((route) => route.id === routeId)

interface Props {
  selectedRouteIds: string[]
  selectedVehicleId: VehicleId | undefined
  deselectRoute: (routeId: RouteId) => void
  reverseLadder: (routeId: RouteId) => void
  toggleCrowding: (routeId: RouteId) => void
  ladderDirections: LadderDirections
  ladderCrowdingToggles: LadderCrowdingToggles
  onAddDetour?: (route: Route) => void
  onOpenDetour?: (detourId: DetourId) => void
}

const RouteLadders = ({
  selectedRouteIds,
  selectedVehicleId,
  deselectRoute,
  reverseLadder,
  toggleCrowding,
  ladderDirections,
  ladderCrowdingToggles,
  onAddDetour,
  onOpenDetour,
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

  const routes: Route[] | null = useContext(RoutesContext)
  const selectedRoutes: Route[] = selectedRouteIds
    .map((routeId) => findRouteById(routes, routeId))
    .filter((route) => route) as Route[]
  const timepointsByRouteId: TimepointsByRouteId =
    useTimepoints(selectedRouteIds)

  const { socket } = useContext(SocketContext)
  const alerts = useAlerts(socket, selectedRouteIds)
  const routesWithAlerts: RouteId[] = []

  // TODO: once DB is optimized for querying by route and status, we can open individual channels for each route ladder
  // const skateDetours = useActiveDetoursByRoute(socket, selectedRouteIds)
  const allActiveSkateDetours = useActiveDetours(
    socket,
    inTestGroup(TestGroups.DetoursOnLadder)
  )

  const skateDetoursByRouteName = Object.values(allActiveSkateDetours).reduce(
    (acc: ByRouteId<DetoursMap>, cur: SimpleDetour) => {
      acc[cur.route] = { ...acc[cur.route], [cur.id]: cur }
      return acc
    },
    {}
  )

  for (const routeId in alerts) {
    if (alerts[routeId].length > 0) {
      routesWithAlerts.push(routeId)
    }
  }
  for (const routeName in skateDetoursByRouteName) {
    if (Object.keys(skateDetoursByRouteName[routeName]).length > 0) {
      const route = selectedRoutes.find((route) => route.name == routeName)
      if (route) routesWithAlerts.push(route.id)
    }
  }

  return (
    <div
      className="c-route-ladders"
      ref={laddersRef}
      onWheel={onWheel}
      data-testid="route-ladders-div"
    >
      {selectedRoutes.map((route) => (
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
          onAddDetour={onAddDetour}
          onOpenDetour={onOpenDetour}
          skateDetoursForRoute={skateDetoursByRouteName[route.name]}
        />
      ))}
    </div>
  )
}

export default RouteLadders
