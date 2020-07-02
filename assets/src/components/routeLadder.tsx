import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { crowdingIcon, reverseIcon, reverseIconReversed } from "../helpers/icon"
import {
  getLadderCrowdingToggleForRoute,
  LadderCrowdingToggle,
} from "../models/ladderCrowdingToggle"
import {
  getLadderDirectionForRoute,
  LadderDirection,
} from "../models/ladderDirection"
import { isVehicle } from "../models/vehicle"
import {
  groupByPosition,
  VehiclesByPosition,
} from "../models/vehiclesByPosition"
import { VehicleId, VehicleOrGhost } from "../realtime.d"
import { LoadableTimepoints, Route } from "../schedule.d"
import { deselectRoute, flipLadder, toggleLadderCrowding } from "../state"
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
  displayCrowdingToggleIcon,
  ladderDirection,
  ladderCrowdingToggle,
  reverseLadder,
  toggleCrowding,
}: {
  displayCrowdingToggleIcon: boolean
  ladderDirection: LadderDirection
  ladderCrowdingToggle: LadderCrowdingToggle
  reverseLadder: () => void
  toggleCrowding: () => void
}) => {
  return (
    <div className="m-route-ladder__controls">
      <button className="m-route-ladder__reverse" onClick={reverseLadder}>
        {ladderDirection === LadderDirection.OneToZero
          ? reverseIcon("m-route-ladder__reverse-icon")
          : reverseIconReversed("m-route-ladder__reverse-icon")}
        Reverse
      </button>
      {displayCrowdingToggleIcon &&
        (ladderCrowdingToggle ? (
          <button
            className="m-route-ladder__crowding-toggle m-route-ladder__crowding-toggle--hide"
            onClick={toggleCrowding}
          >
            {crowdingIcon(
              "m-route-ladder__crowding-toggle-icon m-route-ladder__crowding-toggle-icon"
            )}
            Hide riders
          </button>
        ) : (
          <button
            className="m-route-ladder__crowding-toggle m-route-ladder__crowding-toggle--show"
            onClick={toggleCrowding}
          >
            {crowdingIcon(
              "m-route-ladder__crowding-toggle-icon m-route-ladder__crowding-toggle-icon"
            )}
            Show riders
          </button>
        ))}
    </div>
  )
}

const someVehicleHasCrowding = (
  vehiclesAndGhosts?: VehicleOrGhost[]
): boolean => {
  if (vehiclesAndGhosts === undefined) {
    return false
  }

  const vehicleWithCrowding = vehiclesAndGhosts.find(
    (vehicleOrGhost) =>
      isVehicle(vehicleOrGhost) &&
      vehicleOrGhost.hasOwnProperty("crowding") &&
      vehicleOrGhost.crowding !== null
  )

  return !!vehicleWithCrowding
}

const RouteLadder = ({
  route,
  timepoints,
  vehiclesAndGhosts,
  selectedVehicleId,
}: Props) => {
  const [{ ladderDirections, ladderCrowdingToggles }, dispatch] = useContext(
    StateDispatchContext
  )
  const ladderDirection = getLadderDirectionForRoute(ladderDirections, route.id)
  const reverseLadder = () => {
    dispatch(flipLadder(route.id))
  }

  const ladderCrowdingToggle = getLadderCrowdingToggleForRoute(
    ladderCrowdingToggles,
    route.id
  )
  const toggleCrowding = () => {
    dispatch(toggleLadderCrowding(route.id))
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
        displayCrowdingToggleIcon={someVehicleHasCrowding(vehiclesAndGhosts)}
        ladderDirection={ladderDirection}
        ladderCrowdingToggle={ladderCrowdingToggle}
        reverseLadder={reverseLadder}
        toggleCrowding={toggleCrowding}
      />

      {timepoints ? (
        <>
          <Ladder
            displayCrowding={ladderCrowdingToggle}
            timepoints={timepoints}
            vehiclesByPosition={byPosition}
            ladderDirection={ladderDirection}
            selectedVehicleId={selectedVehicleId}
          />
          <IncomingBox
            displayCrowding={ladderCrowdingToggle}
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
