import React, { useContext, useState } from "react"
import DispatchContext from "../contexts/dispatchContext"
import { closeIcon, reverseIcon, reverseIconReversed } from "../helpers/icon"
import { LoadableTimepoints, Route, Timepoint, Vehicle } from "../skate.d"
import { deselectRoute } from "../state"
import Loading from "./loading"

interface Props {
  route: Route
  timepoints: LoadableTimepoints
  vehicles: Vehicle[]
}

enum StopListDirection {
  ZeroToOne,
  OneToZero,
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
    <li>
      <em>id:</em> {vehicle.id}
    </li>
    <li>
      <em>label:</em> {vehicle.label}
    </li>
    <li>
      <em>timestamp:</em> {vehicle.timestamp}
    </li>
    <li>
      <em>direction_id:</em> {vehicle.direction_id}
    </li>
    <li>
      <em>route_id:</em> {vehicle.route_id}
    </li>
    <li>
      <em>trip_id:</em> {vehicle.trip_id}
    </li>
    <li>
      <em>stop status:</em> {vehicle.stop_status.status},<br />
      <em>stop:</em> {vehicle.stop_status.stop_id}
    </li>
    <li>
      <em>timepoint status:</em>{" "}
      {vehicle.timepoint_status && vehicle.timepoint_status.status},<br />
      <em>timepoint:</em>{" "}
      {vehicle.timepoint_status && vehicle.timepoint_status.timepoint_id},<br />
      <em>percent:</em>{" "}
      {vehicle.timepoint_status &&
        vehicle.timepoint_status.percent_of_the_way_to_timepoint}
    </li>
  </ul>
)

const RouteLadder = ({ route, timepoints, vehicles }: Props) => {
  const initialDirection: StopListDirection = StopListDirection.ZeroToOne
  const [ladderDirection, setStopListDirection] = useState<StopListDirection>(
    initialDirection
  )

  const reverseStopListDirection = () =>
    setStopListDirection(
      ladderDirection === StopListDirection.ZeroToOne
        ? StopListDirection.OneToZero
        : StopListDirection.ZeroToOne
    )

  const orderedTimepoints: LoadableTimepoints =
    // Use slice to make a copy of the array before destructively reversing
    timepoints && ladderDirection === StopListDirection.OneToZero
      ? timepoints.slice().reverse()
      : timepoints

  return (
    <div className="m-route-ladder">
      <Header route={route} />

      <button
        className="m-route-ladder__reverse"
        onClick={reverseStopListDirection}
      >
        {ladderDirection === StopListDirection.OneToZero
          ? reverseIcon("m-route-ladder__reverse-icon")
          : reverseIconReversed("m-route-ladder__reverse-icon")}
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
