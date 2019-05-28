import React, { useContext, useState } from "react"
import DispatchContext from "../contexts/dispatchContext"
import { reverseIcon, reverseIconReversed } from "../helpers/icon"
import { LoadableTimepoints, Route, Vehicle, VehicleId } from "../skate"
import { deselectRoute } from "../state"
import CloseButton from "./closeButton"
import Ladder, {
  flipLadderDirection,
  LadderDirection,
  VehicleDirection,
  vehicleDirectionOnLadder,
} from "./ladder"
import Loading from "./loading"
import VehicleIcon from "./vehicleIcon"

interface Props {
  route: Route
  timepoints: LoadableTimepoints
  vehicles: Vehicle[]
  selectedVehicleId: VehicleId | undefined
}

const partitionVehiclesByRouteStatus = (vehicles: Vehicle[]): Vehicle[][] =>
  vehicles.reduce(
    ([onRouteVehicles, incomingVehicles]: Vehicle[][], vehicle: Vehicle) =>
      vehicle.route_status === "on_route"
        ? [[...onRouteVehicles, vehicle], incomingVehicles]
        : [onRouteVehicles, [...incomingVehicles, vehicle]],
    [[], []]
  )

const Header = ({ route }: { route: Route }) => {
  const dispatch = useContext(DispatchContext)

  return (
    <div className="m-route-ladder__header">
      <CloseButton onClick={() => dispatch(deselectRoute(route.id))} />

      <div className="m-route-ladder__route-name">{route.id}</div>
    </div>
  )
}

const IncomingBoxVehicle = ({
  vehicle,
  ladderDirection,
}: {
  vehicle: Vehicle
  ladderDirection: LadderDirection
}) => {
  const rotation =
    vehicleDirectionOnLadder(vehicle, ladderDirection) === VehicleDirection.Down
      ? 180
      : 0

  return (
    <div className="m-incoming-box__vehicle" key={vehicle.id}>
      <div className="m-incoming-box__vehicle-icon">
        <svg className="m-incoming-box__vehicle-icon-svg">
          <g transform={`rotate(${rotation},9,7)`}>
            <VehicleIcon scale={0.38} />
          </g>
        </svg>
      </div>
      <div className="m-incoming-box__vehicle-label">{vehicle.label}</div>
    </div>
  )
}

const IncomingBox = ({
  vehicles,
  ladderDirection,
}: {
  vehicles: Vehicle[]
  ladderDirection: LadderDirection
}) => (
  <div className="m-incoming-box">
    <div className="m-incoming-box__header">Incoming</div>
    {vehicles.map(vehicle => (
      <IncomingBoxVehicle
        vehicle={vehicle}
        ladderDirection={ladderDirection}
        key={vehicle.id}
      />
    ))}
  </div>
)

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

  const [onRouteVehicles, incomingVehicles] = partitionVehiclesByRouteStatus(
    vehicles
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
        <>
          <Ladder
            timepoints={timepoints}
            vehicles={onRouteVehicles}
            ladderDirection={ladderDirection}
            selectedVehicleId={selectedVehicleId}
          />
          <IncomingBox
            vehicles={incomingVehicles}
            ladderDirection={ladderDirection}
          />
        </>
      ) : (
        <Loading />
      )}
    </div>
  )
}

export default RouteLadder
