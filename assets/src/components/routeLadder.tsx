import React, { Dispatch, SetStateAction, useContext, useState } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import * as Array from "../helpers/array"
import { reverseIcon, reverseIconReversed } from "../helpers/icon"
import { isAVehicle, isGhost } from "../models/vehicle"
import { Ghost, Vehicle, VehicleId, VehicleOrGhost } from "../realtime.d"
import { LoadableTimepoints, Route } from "../schedule.d"
import { deselectRoute } from "../state"
import CloseButton from "./closeButton"
import IncomingBox from "./incomingBox"
import Ladder, { flipLadderDirection, LadderDirection } from "./ladder"
import LayoverBox from "./layoverBox"
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

  const bottomDirection = ladderDirection === LadderDirection.OneToZero ? 1 : 0

  const vehicles: Vehicle[] = vehiclesAndGhosts
    ? vehiclesAndGhosts.filter(isAVehicle)
    : []
  const ghosts: Ghost[] = vehiclesAndGhosts
    ? vehiclesAndGhosts.filter(isGhost)
    : []
  const [thisRoute, incomingFromOtherRoute] = Array.partition(
    vehicles,
    (vehicle: Vehicle): boolean => vehicle.routeId == route.id
  )
  const onRoute: Vehicle[] = thisRoute.filter(
    vehicle => vehicle.routeStatus == "on_route"
  )
  const layingOver: Vehicle[] = thisRoute.filter(
    vehicle => vehicle.routeStatus == "laying_over"
  )
  const pullingOut: Vehicle[] = thisRoute.filter(
    vehicle => vehicle.routeStatus == "pulling_out"
  )
  const [layingOverBottom, layingOverTop] = Array.partition(
    layingOver,
    (vehicle: Vehicle): boolean => vehicle.directionId === bottomDirection
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
          <LayoverBox vehicles={layingOverTop} classModifier="top" />
          <Ladder
            timepoints={timepoints}
            vehicles={onRoute}
            ghosts={ghosts}
            ladderDirection={ladderDirection}
            selectedVehicleId={selectedVehicleId}
          />
          <LayoverBox vehicles={layingOverBottom} classModifier="bottom" />
          <IncomingBox
            vehicles={incomingFromOtherRoute.concat(pullingOut)}
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
