import React, { useContext, useState } from "react"
import DispatchContext from "../contexts/dispatchContext"
import { reverseIcon, reverseIconReversed } from "../helpers/icon"
import { LoadableTimepoints, Route, Vehicle } from "../skate"
import { deselectRoute, selectVehicle } from "../state"
import CloseButton from "./closeButton"
import Ladder, { flipLadderDirection, LadderDirection } from "./ladder"
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
      <CloseButton onClick={() => dispatch(deselectRoute(route.id))} />

      <div className="m-route-ladder__route-name">{route.id}</div>
    </div>
  )
}

const Vehicle = ({ vehicle }: { vehicle: Vehicle }) => {
  const dispatch = useContext(DispatchContext)

  return (
    <ul
      className="m-route-ladder__vehicle"
      style={{ border: "1px solid black" }}
      onClick={() => dispatch(selectVehicle(vehicle.id))}
    >
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
        <em>latitude:</em> {vehicle.latitude}
      </li>
      <li>
        <em>longitude:</em> {vehicle.longitude}
      </li>
      <li>
        <em>bearing:</em> {vehicle.bearing}
      </li>
      <li>
        <em>speed:</em> {vehicle.speed}
      </li>
      <li>
        <em>stop_sequence:</em> {vehicle.stop_sequence}
      </li>
      <li>
        <em>block_id:</em> {vehicle.block_id}
      </li>
      <li>
        <em>operator_id:</em> {vehicle.operator_id}
      </li>
      <li>
        <em>operator_name:</em> {vehicle.operator_name}
      </li>
      <li>
        <em>run_id:</em> {vehicle.run_id}
      </li>
      <li>
        <em>stop status:</em> {vehicle.stop_status.status},<br />
        <em>stop:</em> {vehicle.stop_status.stop_id}
      </li>
      <li>
        <em>timepoint status:</em>{" "}
        {vehicle.timepoint_status && vehicle.timepoint_status.status},<br />
        <em>timepoint:</em>{" "}
        {vehicle.timepoint_status && vehicle.timepoint_status.timepoint_id},
        <br />
        <em>fraction before:</em>{" "}
        {vehicle.timepoint_status &&
          vehicle.timepoint_status.fraction_until_timepoint}
      </li>
    </ul>
  )
}

const RouteLadder = ({ route, timepoints, vehicles }: Props) => {
  const initialDirection: LadderDirection = LadderDirection.ZeroToOne
  const [ladderDirection, setLadderDirection] = useState<LadderDirection>(
    initialDirection
  )

  return (
    <div className="m-route-ladder">
      <Header route={route} />

      <button
        className="m-route-ladder__reverse"
        onClick={() => setLadderDirection(flipLadderDirection)}
      >
        {ladderDirection === LadderDirection.OneToZero
          ? reverseIcon("m-route-ladder__reverse-icon")
          : reverseIconReversed("m-route-ladder__reverse-icon")}
        Reverse
      </button>

      {timepoints ? (
        <Ladder
          timepoints={timepoints}
          vehicles={vehicles}
          ladderDirection={ladderDirection}
        />
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
