import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { reverseIcon, reverseIconReversed } from "../helpers/icon"
import {
  getLadderDirectionForRoute,
  LadderDirection,
} from "../models/ladderDirection"
import {
  groupByPosition,
  VehiclesByPosition,
} from "../models/vehiclesByPosition"
import { VehicleId, VehicleOrGhost } from "../realtime.d"
import { LoadableTimepoints, Route } from "../schedule.d"
import { deselectRoute, flipLadder } from "../state"
import CloseButton from "./closeButton"
import IncomingBox from "./incomingBox"
import Ladder from "./ladder"
import Loading from "./loading"

interface Props {
  route: Route
  timepoints: LoadableTimepoints
  vehiclesAndGhosts?: VehicleOrGhost[]
  selectedVehicleId: VehicleId | undefined
}

const Header = ({ route }: { route: Route }) => {
  const [, dispatch] = useContext(StateDispatchContext)

  return (
    <div className="m-route-ladder__header">
      <CloseButton onClick={() => dispatch(deselectRoute(route.id))} />

      <div className="m-route-ladder__route-name">{route.name}</div>
    </div>
  )
}

const Controls = ({
  ladderDirection,
  reverseLadder,
}: {
  ladderDirection: LadderDirection
  reverseLadder: () => void
}) => (
  <div className="m-route-ladder__controls">
    <button className="m-route-ladder__reverse" onClick={reverseLadder}>
      {ladderDirection === LadderDirection.OneToZero
        ? reverseIcon("m-route-ladder__reverse-icon")
        : reverseIconReversed("m-route-ladder__reverse-icon")}
      Reverse
    </button>
  </div>
)

const RouteLadder = ({
  route,
  timepoints,
  vehiclesAndGhosts,
  selectedVehicleId,
}: Props) => {
  const [{ ladderDirections }, dispatch] = useContext(StateDispatchContext)
  const ladderDirection = getLadderDirectionForRoute(ladderDirections, route.id)
  const reverseLadder = () => {
    dispatch(flipLadder(route.id))
  }

  const byPosition: VehiclesByPosition = groupByPosition(
    vehiclesAndGhosts,
    route.id,
    ladderDirection
  )

  return (
    <>
      <Header route={route} />
      <Controls
        ladderDirection={ladderDirection}
        reverseLadder={reverseLadder}
      />

      {timepoints ? (
        <>
          <Ladder
            timepoints={timepoints}
            vehiclesByPosition={byPosition}
            ladderDirection={ladderDirection}
            selectedVehicleId={selectedVehicleId}
          />
          <IncomingBox
            vehiclesAndGhosts={byPosition.incoming}
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
