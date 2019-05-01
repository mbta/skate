import React, { useContext } from "react"
import DispatchContext from "../contexts/dispatchContext"
import { closeIcon } from "../helpers/icon"
import { LoadableTimepoints, Route, TimepointId, Vehicle } from "../skate"
import { deselectRoute } from "../state"
import Loading from "./loading"

interface Props {
  route: Route
  timepointIds: LoadableTimepoints
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

const Timepoint = ({ timepointId }: { timepointId: TimepointId }) => (
  <li className="m-route-ladder__timepoint">
    <TimepointStop />
    <div className="m-route-ladder__timepoint-name">{timepointId}</div>
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

const RouteLadder = ({ route, timepointIds, vehicles }: Props) => (
  <div className="m-route-ladder">
    <Header route={route} />

    {timepointIds ? (
      <ol className="m-route-ladder__timepoints">
        {timepointIds.map(timepointId => (
          <Timepoint key={timepointId} timepointId={timepointId} />
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

export default RouteLadder
