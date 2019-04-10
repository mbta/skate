import React from "react"
import { Route, TimepointsByRoute } from "../skate"
import { Dispatch } from "../state"
import RouteLadder from "./routeLadder"

interface Props {
  routes: Route[]
  dispatch: Dispatch
  timepointsByRoute: TimepointsByRoute
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
