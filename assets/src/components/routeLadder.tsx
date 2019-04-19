import React, { useContext, useEffect } from "react"
import { fetchTimepointsForRoute } from "../api"
import DispatchContext from "../contexts/dispatchContext"
import { LoadableTimepoints, Route, Timepoint } from "../skate"
import {
  deselectRoute,
  setLoadingTimepointsForRoute,
  setTimepointsForRoute,
} from "../state"
import Loading from "./loading"

interface Props {
  route: Route
  timepoints: LoadableTimepoints
}

const Header = ({ route }: { route: Route }) => {
  const dispatch = useContext(DispatchContext)

  return (
    <div className="m-route-ladder__header">
      <button
        className="m-route-ladder__close"
        onClick={() => dispatch(deselectRoute(route.id))}
      >
        ✖
      </button>

      <div className="m-route-ladder__route-name">{route.id}</div>
    </div>
  )
}

const TimepointStop = () => (
  <div className="m-route-ladder__stop">
    <svg height="60" width="20">
      <line x1="10" y1="3" x2="10" y2="60" />
      <circle cx="10" cy="3" r="3" />
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

const RouteLadder = ({ route, timepoints }: Props) => {
  const dispatch = useContext(DispatchContext)

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
      <Header route={route} />

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
