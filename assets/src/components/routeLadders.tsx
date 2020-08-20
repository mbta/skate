import React, { useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import { VehiclesByRouteIdContext } from "../contexts/vehiclesByRouteIdContext"
import { VehicleId, VehicleOrGhost } from "../realtime.d"
import { ByRouteId, Route, TimepointsByRouteId } from "../schedule.d"
import RouteLadder from "./routeLadder"

import { useChannel } from "../hooks/useChannel"

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
  const { socket } = useContext(SocketContext)
  useChannel<void | null>({
    socket,
    topic: "notifications",
    event: "notification",
    // tslint:disable-next-line
    parser: console.log,
    loadingState: null,
  })
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
