import React, { useContext, useState } from "react"
import DispatchContext from "../contexts/dispatchContext"
import { reverseIcon, reverseIconReversed } from "../helpers/icon"
import { LoadableTimepoints, Route, Vehicle, VehicleId } from "../skate"
import { deselectRoute } from "../state"
import CloseButton from "./closeButton"
import IncomingBox from "./incomingBox"
import Ladder, { flipLadderDirection, LadderDirection } from "./ladder"
import Loading from "./loading"

interface Props {
  route: Route
  timepoints: LoadableTimepoints
  vehicles: Vehicle[]
  selectedVehicleId: VehicleId | undefined
}

interface PartitionedVehicles {
  onRouteVehicles: Vehicle[]
  incomingVehicles: Vehicle[]
}
const partitionVehiclesByRouteStatus = (
  vehicles: Vehicle[]
): PartitionedVehicles =>
  vehicles.reduce(
    (
      { onRouteVehicles, incomingVehicles }: PartitionedVehicles,
      vehicle: Vehicle
    ) =>
      vehicle.routeStatus === "on_route"
        ? { onRouteVehicles: [...onRouteVehicles, vehicle], incomingVehicles }
        : { onRouteVehicles, incomingVehicles: [...incomingVehicles, vehicle] },
    { onRouteVehicles: [], incomingVehicles: [] }
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

  const { onRouteVehicles, incomingVehicles } = partitionVehiclesByRouteStatus(
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
            selectedVehicleId={selectedVehicleId}
          />
        </>
      ) : (
        <Loading />
      )}
    </div>
  )
}

export default RouteLadder
