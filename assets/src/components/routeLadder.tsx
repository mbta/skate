import React, { useContext, useState } from "react"
import DispatchContext from "../contexts/dispatchContext"
import { closeIcon, reverseIcon, reverseIconReversed } from "../helpers/icon"
import { LoadableTimepoints, Route, Timepoint, Vehicle } from "../skate"
import { deselectRoute } from "../state"
import Loading from "./loading"

interface Props {
  route: Route
  timepoints: LoadableTimepoints
  vehicles: Vehicle[]
}

const Header = ({ route }: { route: Route }) => {
  const dispatch = useContext(DispatchContext)

  return (
    <div className="m-route-ladder__header">
      <button
        className="m-route-ladder__close"
        onClick={() => dispatch(deselectRoute(route.id))}
      >
        {closeIcon("m-route-ladder__close-icon")}
      </button>

      <div className="m-route-ladder__route-name">{route.id}</div>
    </div>
  )
}

const TimepointStop = () => (
  <div className="m-route-ladder__stop">
    <svg height="60" width="20">
      <line x1="10" y1="4" x2="10" y2="60" />
      <circle cx="10" cy="4" r="3" />
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

const Vehicle = ({ vehicle }: { vehicle: Vehicle }) => (
  <ul style={{ border: "1px solid black" }}>
    <li>id {vehicle.id}</li>
    <li>label {vehicle.label}</li>
    <li>timestamp {vehicle.timestamp}</li>
    <li>direction_id {vehicle.direction_id}</li>
    <li>route_id {vehicle.route_id}</li>
    <li>trip_id {vehicle.trip_id}</li>
    <li>current_status {vehicle.current_status}</li>
    <li>stop_id {vehicle.stop_id}</li>
  </ul>
)

const RouteLadder = ({ route, timepoints, vehicles }: Props) => {
  const [shouldReverseStops, setShouldReverseStops] = useState(false)

  const swapReverse = () => setShouldReverseStops(!shouldReverseStops)

  const orderedTimepoints: LoadableTimepoints =
    // Use slice to make a copy of the array before destructively reversing
    timepoints && shouldReverseStops ? timepoints.slice().reverse() : timepoints

  return (
    <div className="m-route-ladder">
      <Header route={route} />

      <button className="m-route-ladder__reverse" onClick={swapReverse}>
        {shouldReverseStops
          ? reverseIconReversed("m-route-ladder__reverse-icon")
          : reverseIcon("m-route-ladder__reverse-icon")}
        Reverse
      </button>

      {orderedTimepoints ? (
        <ol className="m-route-ladder__timepoints">
          {orderedTimepoints.map(timepoint => (
            <Timepoint key={timepoint.id} timepoint={timepoint} />
          ))}
        </ol>
      ) : (
        <Loading />
      )}
      {vehicles.map(vehicle => (
        <Vehicle key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  )
}

export default RouteLadder
