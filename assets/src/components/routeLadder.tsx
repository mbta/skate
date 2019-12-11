import React, { Dispatch, SetStateAction, useContext, useState } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { reverseIcon, reverseIconReversed } from "../helpers/icon"
import { Vehicle, VehicleId, VehicleOrGhost } from "../realtime.d"
import { DirectionId, LoadableTimepoints, Route, RouteId } from "../schedule.d"
import { deselectRoute } from "../state"
import CloseButton from "./closeButton"
import IncomingBox from "./incomingBox"
import Ladder, { flipLadderDirection, LadderDirection } from "./ladder"
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
  const initialDirection: LadderDirection = LadderDirection.ZeroToOne
  const [ladderDirection, setLadderDirection] = useState<LadderDirection>(
    initialDirection
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
            vehicles={byPosition.layingOverTop}
            position={LayoverBoxPosition.Top}
          />
          <Ladder
            timepoints={timepoints}
            vehiclesAndGhosts={byPosition.onRoute}
            ladderDirection={ladderDirection}
            selectedVehicleId={selectedVehicleId}
          />
          <LayoverBox
            vehicles={byPosition.layingOverBottom}
            position={LayoverBoxPosition.Bottom}
          />
          <IncomingBox
            vehicles={byPosition.incoming}
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
  layingOverTop: Vehicle[]
  layingOverBottom: Vehicle[]
  incoming: Vehicle[]
}

export const groupByPosition = (
  vehiclesAndGhosts: VehicleOrGhost[] | undefined,
  routeId: RouteId,
  ladderDirection: LadderDirection
): ByPosition => {
  const upwardDirection: DirectionId =
    ladderDirection === LadderDirection.OneToZero ? 1 : 0

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
                layingOverBottom: [...acc.layingOverBottom, current as Vehicle],
              }
            } else {
              return {
                ...acc,
                layingOverTop: [...acc.layingOverTop, current as Vehicle],
              }
            }
          case "pulling_out":
            return { ...acc, incoming: [...acc.incoming, current as Vehicle] }
          default:
            return acc
        }
      } else {
        // incoming from another route
        return { ...acc, incoming: [...acc.incoming, current as Vehicle] }
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
