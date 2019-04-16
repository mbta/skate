import React, { useEffect } from "react"
import { fetchTimepointsForRoute } from "../api"
import { LoadableTimepoints, Route, Timepoint } from "../skate"
import {
  deselectRoute,
  Dispatch,
  setLoadingTimepointsForRoute,
  setTimepointsForRoute,
} from "../state"
import Loading from "./loading"

interface Props {
  route: Route
  timepoints: LoadableTimepoints
  dispatch: Dispatch
}

const Header = ({ route, dispatch }: { route: Route; dispatch: Dispatch }) => (
  <div className="m-route-ladder__header">
    <div className="m-route-ladder__route-name">{route.id}</div>

    <button
      className="m-route-ladder__close"
      onClick={() => dispatch(deselectRoute(route.id))}
    >
      ✖
    </button>
  </div>
)

const TimepointStop = () => (
  <div className="m-route-ladder__stop">
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

const RouteLadder = ({ route, timepoints, dispatch }: Props) => {
  useEffect(() => {
    if (timepoints === undefined) {
      dispatch(setLoadingTimepointsForRoute(route.id))

      fetchTimepointsForRoute(route.id).then((newTimepoints: Timepoint[]) =>
        dispatch(setTimepointsForRoute(route.id, newTimepoints))
      )
    }
  }, [])

  return (
    <div className="m-route-ladder">
      <Header route={route} dispatch={dispatch} />

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
