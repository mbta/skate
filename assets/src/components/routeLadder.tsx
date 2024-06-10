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
import { isVehicleInScheduledService } from "../models/vehicle"
import {
  groupByPosition,
  VehiclesByPosition,
} from "../models/vehiclesByPosition"
import { VehicleId, VehicleInScheduledService, Ghost } from "../realtime.d"
import { LoadableTimepoints, Route, RouteId } from "../schedule.d"
import IncomingBox from "./incomingBox"
import Ladder from "./ladder"
import Loading from "./loading"
import { CloseButton as OldCloseButton } from "./closeButton"
import Tippy from "@tippyjs/react"
import { tagManagerEvent } from "../helpers/googleTagManager"
import inTestGroup, { TestGroups } from "../userInTestGroup"
import { ExclamationTriangleFill, PlusSquare } from "../helpers/bsIcons"
import { RoutePill } from "./routePill"
import { Card, CloseButton, Dropdown } from "react-bootstrap"

interface Props {
  route: Route
  timepoints: LoadableTimepoints
  vehiclesAndGhosts?: (VehicleInScheduledService | Ghost)[]
  selectedVehicleId: VehicleId | undefined
  deselectRoute: (routeId: RouteId) => void
  reverseLadder: (routeId: RouteId) => void
  toggleCrowding: (routeId: RouteId) => void
  ladderDirections: LadderDirections
  ladderCrowdingToggles: LadderCrowdingToggles
  hasAlert: boolean
  onAddDetour?: (route: Route) => void
}

export const Header = ({
  routeName,
  onClose,
  hasAlert,
}: {
  routeName: string
  onClose: () => void
  hasAlert: boolean
}) => {
  return (
    <div className="c-route-ladder__header">
      {hasAlert && (
        <Tippy
          content="Active detour"
          trigger="click"
          onShow={() => tagManagerEvent("alert_tooltip_clicked")}
        >
          <AlertIcon
            className="c-route-ladder__alert-icon"
            aria-label="Route Alert"
          />
        </Tippy>
      )}
      <div className="c-route-ladder__close-button-container">
        <OldCloseButton closeButtonType="l_darker" onClick={onClose} />
      </div>

      <div className="c-route-ladder__route-name">{routeName}</div>
    </div>
  )
}

// TODO: delete old header after roll-out
export const NewHeader = ({
  routeName,
  onClose,
  hasAlert,
  showDropdown,

  onClickAddDetour,
}: {
  routeName: string
  onClose: () => void
  hasAlert: boolean

  showDropdown: boolean

  onClickAddDetour?: () => void
}) => {
  return (
    <Card className="c-new-route-ladder__header">
      <Card.Body>
        <div className="c-route-ladder__header__action-container">
          {showDropdown && (
            <Dropdown className="border-box inherit-box">
              <Dropdown.Toggle className="c-route-ladder__dropdown-button">
                <span className="visually-hidden">Route Options</span>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item className="icon-link" onClick={onClickAddDetour}>
                  <PlusSquare />
                  Add detour
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
          {hasAlert && (
            <Tippy
              content="Active detour"
              trigger="click"
              onShow={() => tagManagerEvent("alert_tooltip_clicked")}
            >
              <div className="c-route-ladder__alert-icon">
                <ExclamationTriangleFill aria-label="Route Alert" />
              </div>
            </Tippy>
          )}
        </div>
        <RoutePill
          routeName={routeName}
          largeFormat
          className="c-route-ladder__route-pill c-route-pill"
        />
        <div className="c-route-ladder__close-button-container">
          <CloseButton className="p-2" onClick={onClose} />
        </div>
      </Card.Body>
    </Card>
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
    <div className="c-route-ladder__controls">
      <button className="c-route-ladder__reverse" onClick={reverseLadder}>
        {ladderDirection === LadderDirection.OneToZero ? (
          <ReverseIcon className="c-route-ladder__reverse-icon" />
        ) : (
          <ReverseIconReversed className="c-route-ladder__reverse-icon" />
        )}
        Reverse
      </button>
      {displayCrowdingToggleIcon &&
        (ladderCrowdingToggle ? (
          <button
            className="c-route-ladder__crowding-toggle c-route-ladder__crowding-toggle--hide"
            onClick={toggleCrowding}
          >
            <CrowdingIcon className="c-route-ladder__crowding-toggle-icon c-route-ladder__crowding-toggle-icon" />
            Hide riders
          </button>
        ) : (
          <button
            className="c-route-ladder__crowding-toggle c-route-ladder__crowding-toggle--show"
            onClick={toggleCrowding}
          >
            <CrowdingIcon className="c-route-ladder__crowding-toggle-icon c-route-ladder__crowding-toggle-icon" />
            Show riders
          </button>
        ))}
    </div>
  )
}

const someVehicleHasCrowding = (
  vehiclesAndGhosts: (VehicleInScheduledService | Ghost)[] | undefined,
  routeId: RouteId
): boolean => {
  if (vehiclesAndGhosts === undefined) {
    return false
  }

  const vehicleWithCrowding = vehiclesAndGhosts.find(
    (vehicleOrGhost) =>
      isVehicleInScheduledService(vehicleOrGhost) &&
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
  onAddDetour,
}: Props) => {
  const ladderDirection = getLadderDirectionForRoute(ladderDirections, route.id)

  const ladderCrowdingToggle = getLadderCrowdingToggleForRoute(
    ladderCrowdingToggles,
    route.id
  )

  const byPosition: VehiclesByPosition = groupByPosition(
    vehiclesAndGhosts?.filter((vehicleOrGhost) => {
      const nonRevenueOffCourse =
        isVehicleInScheduledService(vehicleOrGhost) &&
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
      {inTestGroup(TestGroups.RouteLadderHeaderUpdate) ? (
        <NewHeader
          routeName={route.name}
          hasAlert={hasAlert}
          onClose={() => {
            deselectRoute(route.id)
          }}
          showDropdown={
            inTestGroup(TestGroups.DetoursPilot) &&
            inTestGroup(TestGroups.DetourRouteSelection)
          }
          onClickAddDetour={() => {
            onAddDetour?.(route)
          }}
        />
      ) : (
        <Header
          routeName={route.name}
          hasAlert={hasAlert}
          onClose={() => {
            deselectRoute(route.id)
          }}
        />
      )}
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
