import React from "react"
import { Route, TimepointsByRouteId } from "../skate"
import { Dispatch } from "../state"
import RouteLadder from "./routeLadder"

interface Props {
  routes: Route[]
  dispatch: Dispatch
  timepointsByRoute: TimepointsByRouteId
}

const RouteLadders = ({ routes, dispatch, timepointsByRoute }: Props) => (
  <div className="m-route-ladders">
    {routes.map(route => (
      <RouteLadder
        key={route.id}
        route={route}
        dispatch={dispatch}
        timepointsByRoute={timepointsByRoute}
      />
    ))}
  </div>
)

export default RouteLadders
