import React, { Dispatch, SetStateAction, useContext, useState } from "react"
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

const Controls = ({
  ladderDirection,
  setLadderDirection,
}: {
  ladderDirection: LadderDirection
  setLadderDirection: Dispatch<SetStateAction<LadderDirection>>
}) => (
  <div className="m-route-ladder__controls">
    <button
      className="m-route-ladder__reverse"
      onClick={() => setLadderDirection(flipLadderDirection)}
    >
      {ladderDirection === LadderDirection.OneToZero
        ? reverseIcon("m-route-ladder__reverse-icon")
        : reverseIconReversed("m-route-ladder__reverse-icon")}
      Reverse
    </button>
  </div>
)

const HeaderAndControls = ({
  route,
  ladderDirection,
  setLadderDirection,
}: {
  route: Route
  ladderDirection: LadderDirection
  setLadderDirection: Dispatch<SetStateAction<LadderDirection>>
}) => (
  <>
    <Header route={route} />
    <Controls
      ladderDirection={ladderDirection}
      setLadderDirection={setLadderDirection}
    />
  </>
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

  const { onRouteVehicles, incomingVehicles } = partitionVehiclesByRouteStatus(
    vehicles
  )

  return (
    <>
      <HeaderAndControls
        route={route}
        ladderDirection={ladderDirection}
        setLadderDirection={setLadderDirection}
      />

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
    </>
  )
}

export default RouteLadder
