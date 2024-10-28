import React, { useId } from "react"
import { CrowdingIcon, ReverseIcon, ReverseIconReversed } from "../helpers/icon"
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
import { VehicleId, VehicleInScheduledService, Ghost } from "../realtime"
import { LoadableTimepoints, Route, RouteId } from "../schedule.d"
import IncomingBox from "./incomingBox"
import Ladder from "./ladder"
import Loading from "./loading"
import Tippy from "@tippyjs/react"
import { tagManagerEvent } from "../helpers/googleTagManager"
import inTestGroup, { TestGroups } from "../userInTestGroup"
import {
  ExclamationTriangleFill,
  PlusSquare,
  ThreeDotsVertical,
} from "../helpers/bsIcons"
import { RoutePill } from "./routePill"
import { Card, CloseButton, Dropdown } from "react-bootstrap"
import { joinClasses, joinTruthy } from "../helpers/dom"

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
  showDropdown,

  onClickAddDetour,
}: {
  routeName: string
  onClose: () => void
  hasAlert: boolean

  showDropdown: boolean

  onClickAddDetour?: () => void
}) => {
  const routePillId = "route-pill" + useId()
  const routeOptionsToggleId = "route-options-toggle" + useId()
  return (
    <Card className="c-route-ladder__header">
      <Card.Body>
        <div
          className={joinClasses([
            "c-route-ladder__dropdown",
            hasAlert && "c-route-ladder__dropdown--non-skate-alert",
          ])}
        >
          {showDropdown && (
            <Dropdown className="border-box inherit-box">
              <Dropdown.Toggle
                className="c-route-ladder__dropdown-button d-none d-sm-flex"
                aria-labelledby={joinTruthy([
                  routePillId,
                  routeOptionsToggleId,
                ])}
              >
                <ThreeDotsVertical />
                <span className="visually-hidden" id={routeOptionsToggleId}>
                  Route Options
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Header>
                  <div className="c-route-ladder__dropdown-header-text">
                    Adjustments
                  </div>
                </Dropdown.Header>
                <Dropdown.Item className="icon-link" onClick={onClickAddDetour} data-fs-element="Add Detour on Route">
                  <PlusSquare /> Add detour
                </Dropdown.Item>
                {hasAlert && (
                  <>
                    <Dropdown.Divider className="border-top-0" />
                    <Dropdown.Header>
                      <div className="c-route-ladder__dropdown-header-text">
                        Active detours
                      </div>
                    </Dropdown.Header>
                    <Dropdown.ItemText className="lh-base pb-4">
                      This route has an active detour. View detour details on{" "}
                      <a href="https://www.mbta.com/">mbta.com</a> or in IRIS.
                    </Dropdown.ItemText>
                  </>
                )}
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>
        <RoutePill
          id={routePillId}
          routeName={routeName}
          largeFormat
          className="c-route-pill--dynamic-size"
        >
          {hasAlert && (
            <Tippy
              content="Active detour"
              trigger="click"
              onShow={() => tagManagerEvent("alert_tooltip_clicked")}
            >
              <div
                className="c-route-ladder__alert-icon"
                aria-label="Route Alert"
              >
                <ExclamationTriangleFill />
              </div>
            </Tippy>
          )}
        </RoutePill>
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
      <Header
        routeName={route.name}
        hasAlert={hasAlert}
        onClose={() => {
          deselectRoute(route.id)
        }}
        showDropdown={inTestGroup(TestGroups.DetoursPilot)}
        onClickAddDetour={() => {
          onAddDetour?.(route)
        }}
      />
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
