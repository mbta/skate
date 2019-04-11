import React from "react"
import { Route } from "../skate"
import { Dispatch, TimepointsForRouteId } from "../state"
import RouteLadder from "./routeLadder"

interface Props {
  routes: Route[]
  dispatch: Dispatch
  timepointsForRouteId: TimepointsForRouteId
}

const RouteLadders = ({ routes, dispatch, timepointsForRouteId }: Props) => (
  <div className="m-route-ladders">
    {routes.map(route => (
      <RouteLadder
        key={route.id}
        route={route}
        dispatch={dispatch}
        timepointsForRouteId={timepointsForRouteId}
      />
    ))}
  </div>
)

export default RouteLadders
