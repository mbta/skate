import React from "react"
import {
  AlertIcon,
  CrowdingIcon,
  ReverseIcon,
  ReverseIconReversed,
} from "../helpers/icon"
import {
  getLadderCrowdingToggleForRoute,
  LadderCrowdingToggle,
  LadderCrowdingToggles,
} from "../models/ladderCrowdingToggle"
import {
  getLadderDirectionForRoute,
  LadderDirection,
  LadderDirections,
} from "../models/ladderDirection"
import { isVehicle } from "../models/vehicle"
import {
  groupByPosition,
  VehiclesByPosition,
} from "../models/vehiclesByPosition"
import { VehicleId, VehicleOrGhost } from "../realtime.d"
import { LoadableTimepoints, Route, RouteId } from "../schedule.d"
import IncomingBox from "./incomingBox"
import Ladder from "./ladder"
import Loading from "./loading"
import CloseButton from "./closeButton"
import Tippy from "@tippyjs/react"
import { tagManagerEvent } from "../helpers/googleTagManager"

interface Props {
  route: Route
  timepoints: LoadableTimepoints
  vehiclesAndGhosts?: VehicleOrGhost[]
  selectedVehicleId: VehicleId | undefined
  deselectRoute: (routeId: RouteId) => void
  reverseLadder: (routeId: RouteId) => void
  toggleCrowding: (routeId: RouteId) => void
  ladderDirections: LadderDirections
  ladderCrowdingToggles: LadderCrowdingToggles
  hasAlert: boolean
}

const Header = ({
  route,
  deselectRoute,
  hasAlert,
}: {
  route: Route
  deselectRoute: (routeId: RouteId) => void
  hasAlert: boolean
}) => {
  return (
    <div className="m-route-ladder__header">
      {hasAlert && (
        <Tippy
          content="Active detour"
          trigger="click"
          onShow={() => tagManagerEvent("alert_tooltip_clicked")}
        >
          <AlertIcon
            className="m-route-ladder__alert-icon"
            aria-label="Route Alert"
          />
        </Tippy>
      )}
      <div className="m-route-ladder__close-button-container">
        <CloseButton
          closeButtonType="l_darker"
          onClick={() => deselectRoute(route.id)}
        />
      </div>

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
        {ladderDirection === LadderDirection.OneToZero ? (
          <ReverseIcon className="m-route-ladder__reverse-icon" />
        ) : (
          <ReverseIconReversed className="m-route-ladder__reverse-icon" />
        )}
        Reverse
      </button>
      {displayCrowdingToggleIcon &&
        (ladderCrowdingToggle ? (
          <button
            className="m-route-ladder__crowding-toggle m-route-ladder__crowding-toggle--hide"
            onClick={toggleCrowding}
          >
            <CrowdingIcon className="m-route-ladder__crowding-toggle-icon m-route-ladder__crowding-toggle-icon" />
            Hide riders
          </button>
        ) : (
          <button
            className="m-route-ladder__crowding-toggle m-route-ladder__crowding-toggle--show"
            onClick={toggleCrowding}
          >
            <CrowdingIcon className="m-route-ladder__crowding-toggle-icon m-route-ladder__crowding-toggle-icon" />
            Show riders
          </button>
        ))}
    </div>
  )
}

const someVehicleHasCrowding = (
  vehiclesAndGhosts: VehicleOrGhost[] | undefined,
  routeId: RouteId
): boolean => {
  if (vehiclesAndGhosts === undefined) {
    return false
  }

  const vehicleWithCrowding = vehiclesAndGhosts.find(
    (vehicleOrGhost) =>
      isVehicle(vehicleOrGhost) &&
      vehicleOrGhost.routeId === routeId &&
      Object.prototype.hasOwnProperty.call(vehicleOrGhost, "crowding") &&
      vehicleOrGhost.crowding !== null
  )

  return !!vehicleWithCrowding
}

const RouteLadder = ({
  route,
  timepoints,
  vehiclesAndGhosts,
  selectedVehicleId,
  deselectRoute,
  reverseLadder,
  toggleCrowding,
  ladderDirections,
  ladderCrowdingToggles,
  hasAlert,
}: Props) => {
  const ladderDirection = getLadderDirectionForRoute(ladderDirections, route.id)

  const ladderCrowdingToggle = getLadderCrowdingToggleForRoute(
    ladderCrowdingToggles,
    route.id
  )

  const byPosition: VehiclesByPosition = groupByPosition(
    vehiclesAndGhosts?.filter((vehicleOrGhost) => {
      const nonRevenueOffCourse =
        isVehicle(vehicleOrGhost) &&
        vehicleOrGhost.isOffCourse &&
        !vehicleOrGhost.isRevenue

      return !nonRevenueOffCourse
    }),
    route.id,
    ladderDirection
  )

  const displayCrowding = someVehicleHasCrowding(vehiclesAndGhosts, route.id)

  return (
    <>
      <Header route={route} deselectRoute={deselectRoute} hasAlert={hasAlert} />
      <Controls
        displayCrowdingToggleIcon={displayCrowding}
        ladderDirection={ladderDirection}
        ladderCrowdingToggle={ladderCrowdingToggle}
        reverseLadder={() => reverseLadder(route.id)}
        toggleCrowding={() => toggleCrowding(route.id)}
      />

      {timepoints ? (
        <>
          <Ladder
            displayCrowding={displayCrowding && ladderCrowdingToggle}
            timepoints={timepoints}
            vehiclesByPosition={byPosition}
            ladderDirection={ladderDirection}
            selectedVehicleId={selectedVehicleId}
          />
          <IncomingBox
            displayCrowding={displayCrowding && ladderCrowdingToggle}
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
