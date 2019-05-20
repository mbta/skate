import React, { useContext, useState } from "react"
import DispatchContext from "../contexts/dispatchContext"
import { reverseIcon, reverseIconReversed } from "../helpers/icon"
import { LoadableTimepoints, Route, Vehicle, VehicleId } from "../skate"
import { deselectRoute, selectVehicle } from "../state"
import CloseButton from "./closeButton"
import Ladder, { flipLadderDirection, LadderDirection } from "./ladder"
import Loading from "./loading"

interface Props {
  route: Route
  timepoints: LoadableTimepoints
  vehicles: Vehicle[]
  selectedVehicleId: VehicleId | undefined
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
        <em>latitude:</em> {vehicle.latitude}
      </li>
      <li>
        <em>longitude:</em> {vehicle.longitude}
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

const RouteLadder = ({
  route,
  timepoints,
  vehicles,
  selectedVehicleId,
}: Props) => {
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
          selectedVehicleId={selectedVehicleId}
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
