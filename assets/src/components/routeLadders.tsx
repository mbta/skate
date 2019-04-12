import React from "react"
import { Route, TimepointsByRouteId } from "../skate"
import { Dispatch } from "../state"
import RouteLadder from "./routeLadder"

interface Props {
  routes: Route[]
  dispatch: Dispatch
  timepointsByRouteId: TimepointsByRouteId
}

const RouteLadders = ({ routes, dispatch, timepointsByRouteId }: Props) => (
  <div className="m-route-ladders">
    {routes.map(route => (
      <RouteLadder
        key={route.id}
        route={route}
        timepoints={timepointsByRouteId[route.id]}
        dispatch={dispatch}
      />
    ))}
  </div>
)

export default RouteLadders
