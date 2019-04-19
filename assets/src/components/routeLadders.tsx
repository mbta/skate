import React from "react"
import { Route, TimepointsByRouteId } from "../skate"
import RouteLadder from "./routeLadder"

interface Props {
  routes: Route[]
  timepointsByRouteId: TimepointsByRouteId
}

const RouteLadders = ({ routes, timepointsByRouteId }: Props) => (
  <div className="m-route-ladders">
    {routes.map(route => (
      <RouteLadder
        key={route.id}
        route={route}
        timepoints={timepointsByRouteId[route.id]}
      />
    ))}
  </div>
)

export default RouteLadders
