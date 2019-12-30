import React, { Dispatch, SetStateAction, useContext, useState } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { reverseIcon, reverseIconReversed } from "../helpers/icon"
import {
  flipLadderDirection,
  LadderDirection,
  defaultLadderDirection,
  upwardDirectionId,
} from "../models/ladderDirection"
import { VehicleId, VehicleOrGhost } from "../realtime.d"
import { DirectionId, LoadableTimepoints, Route, RouteId } from "../schedule.d"
import { deselectRoute } from "../state"
import CloseButton from "./closeButton"
import IncomingBox from "./incomingBox"
import Ladder from "./ladder"
import LayoverBox, { LayoverBoxPosition } from "./layoverBox"
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
  vehiclesAndGhosts,
  selectedVehicleId,
}: Props) => {
  const [ladderDirection, setLadderDirection] = useState<LadderDirection>(
    defaultLadderDirection
  )

  const byPosition: ByPosition = groupByPosition(
    vehiclesAndGhosts,
    route.id,
    ladderDirection
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
          <LayoverBox
            vehiclesAndGhosts={byPosition.layingOverTop}
            position={LayoverBoxPosition.Top}
          />
          <Ladder
            timepoints={timepoints}
            vehiclesAndGhosts={byPosition.onRoute}
            ladderDirection={ladderDirection}
            selectedVehicleId={selectedVehicleId}
          />
          <LayoverBox
            vehiclesAndGhosts={byPosition.layingOverBottom}
            position={LayoverBoxPosition.Bottom}
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

interface ByPosition {
  onRoute: VehicleOrGhost[]
  layingOverTop: VehicleOrGhost[]
  layingOverBottom: VehicleOrGhost[]
  incoming: VehicleOrGhost[]
}

export const groupByPosition = (
  vehiclesAndGhosts: VehicleOrGhost[] | undefined,
  routeId: RouteId,
  ladderDirection: LadderDirection
): ByPosition => {
  const upwardDirection: DirectionId = upwardDirectionId(ladderDirection)

  return (vehiclesAndGhosts || []).reduce(
    (acc: ByPosition, current: VehicleOrGhost) => {
      if (current.routeId === routeId) {
        switch (current.routeStatus) {
          case "on_route":
            return { ...acc, onRoute: [...acc.onRoute, current] }
          case "laying_over":
            if (current.directionId === upwardDirection) {
              return {
                ...acc,
                layingOverBottom: [...acc.layingOverBottom, current],
              }
            } else {
              return {
                ...acc,
                layingOverTop: [...acc.layingOverTop, current],
              }
            }
          case "pulling_out":
            return { ...acc, incoming: [...acc.incoming, current] }
          default:
            return acc
        }
      } else {
        // incoming from another route
        return { ...acc, incoming: [...acc.incoming, current] }
      }
    },
    {
      onRoute: [],
      layingOverTop: [],
      layingOverBottom: [],
      incoming: [],
    } as ByPosition
  )
}

export default RouteLadder
