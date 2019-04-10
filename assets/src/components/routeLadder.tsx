import React, { useEffect } from "react"
import { fetchTimepointsForRoute } from "../api"
import { Route, Timepoint, TimepointsByRoute } from "../skate"
import { Dispatch, setTimepointsForRoute } from "../state"
import Loading from "./loading"

interface Props {
  route: Route
  dispatch: Dispatch
  timepointsByRoute: TimepointsByRoute
}

const TimepointStop = () => (
  <div className="m-route-ladder__timepoint-stop">
    <svg height="60" width="20">
      <line x1="10" y1="0" x2="10" y2="25" />
      <circle cx="10" cy="30" r="5" />
      <line x1="10" y1="35" x2="10" y2="60" />
    </svg>
  </div>
)

const Timepoint = ({ timepoint }: { timepoint: Timepoint }) => (
  <li className="m-route-ladder__timepoint">
    <TimepointStop />
    <div className="m-route-ladder__timepoint-name">{timepoint.id}</div>
    <TimepointStop />
  </li>
)

const RouteLadder = ({ route, dispatch, timepointsByRoute }: Props) => {
  const timepoints = timepointsByRoute[route.id]

  useEffect(() => {
    if (!timepointsByRoute[route.id]) {
      fetchTimepointsForRoute(route.id).then((newTimepoints: Timepoint[]) =>
        dispatch(setTimepointsForRoute(route.id, newTimepoints))
      )
    }
  })

  return (
    <div className="m-route-ladder">
      <div className="m-route-ladder__route-name">{route.id}</div>

      {timepoints ? (
        <ol className="m-route-ladder__timepoints">
          {timepoints.map(timepoint => (
            <Timepoint key={timepoint.id} timepoint={timepoint} />
          ))}
        </ol>
      ) : (
        <Loading />
      )}
    </div>
  )
}

export default RouteLadder
