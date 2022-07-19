import useComponentSize from "@rehooks/component-size"
import React, { useContext, useRef } from "react"
import Tippy from "@tippyjs/react"
import "tippy.js/dist/tippy.css"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { flatten, partition } from "../helpers/array"
import { className } from "../helpers/dom"
import vehicleLabel from "../helpers/vehicleLabel"
import { blockWaiverAlertStyle } from "../models/blockWaiver"
import { crowdingLabel, OccupancyStatus } from "../models/crowding"
import {
  LadderDirection,
  orderTimepoints,
  VehicleDirection,
} from "../models/ladderDirection"
import {
  LadderVehicle,
  ladderVehiclesFromVehicles,
} from "../models/ladderVehicle"
import {
  ladderVehiclesForLayovers,
  LayoverBoxPosition,
} from "../models/layoverVehicle"
import { isGhost, isVehicle } from "../models/vehicle"
import { VehiclesByPosition } from "../models/vehiclesByPosition"
import { drawnStatus, statusClasses } from "../models/vehicleStatus"
import { Vehicle, VehicleId, VehicleTimepointStatus } from "../realtime.d"
import { Timepoint } from "../schedule.d"
import { selectVehicle } from "../state"
import { CrowdingIconSvgNode } from "./crowdingIcon"
import {
  Orientation,
  Size,
  VehicleIconSvgNode,
  VehicleTooltip,
} from "./vehicleIcon"

export interface Props {
  timepoints: Timepoint[]
  vehiclesByPosition: VehiclesByPosition
  ladderDirection: LadderDirection
  selectedVehicleId?: VehicleId
  displayCrowding?: boolean
}

export type TimepointStatusYFunc = (
  timepointStatus: VehicleTimepointStatus | null,
  direction: VehicleDirection
) => number

export const CENTER_TO_LINE = 40 // x-distance between the center of the ladder and the center of the line
const MARGIN_TOP_BOTTOM = 55 // space between the ends of the ladder and the ends of the viewbox
const MARGIN_LAYOVER_TOP = 35 // space between the top of the ladder and the center of laying over vehicles
const MARGIN_LAYOVER_BOTTOM = 25 // space between the bottom of the ladder and the center of laying over vehicles

const notOverload = ({ vehicle }: LadderVehicle): boolean =>
  isGhost(vehicle) || !vehicle.isOverload

const Ladder = ({
  timepoints,
  vehiclesByPosition,
  ladderDirection,
  selectedVehicleId,
  displayCrowding,
}: Props) => {
  const elementRef = useRef(null)
  const { height } = useComponentSize(elementRef)
  const ladderHeight = height - MARGIN_TOP_BOTTOM * 2

  const orderedTimepoints: Timepoint[] = orderTimepoints(
    timepoints,
    ladderDirection
  )

  const timepointSpacingY: number = ladderHeight / (timepoints.length - 1)
  const timepointStatusY = timepointStatusYFromTimepoints(
    orderedTimepoints,
    timepointSpacingY
  )

  const layoverTopLadderVehicles: LadderVehicle[] = ladderVehiclesForLayovers(
    vehiclesByPosition.layingOverTop,
    LayoverBoxPosition.Top,
    timepointStatusY,
    -MARGIN_LAYOVER_TOP
  )
  const layoverBottomLadderVehicles: LadderVehicle[] =
    ladderVehiclesForLayovers(
      vehiclesByPosition.layingOverBottom,
      LayoverBoxPosition.Bottom,
      timepointStatusY,
      ladderHeight + MARGIN_LAYOVER_BOTTOM
    )

  const { ladderVehicles, widthOfLanes } = ladderVehiclesFromVehicles(
    vehiclesByPosition.onRoute,
    ladderDirection,
    timepointStatusY
  )
  const [selectedLadderVehicles, unselectedLadderVehicles] = partition(
    ladderVehicles,
    (ladderVehicle) => ladderVehicle.vehicle.id === selectedVehicleId
  )

  const width = 120 + 2 * widthOfLanes
  // (0, 0) is in the center of the first timepoint
  const viewBox = [-width / 2, -MARGIN_TOP_BOTTOM, width, height].join(" ")

  return (
    <div className="m-ladder" style={{ width }} ref={elementRef}>
      <svg
        className="m-ladder__svg"
        viewBox={viewBox}
        width={width}
        height={height}
      >
        {!displayCrowding &&
          flatten([
            layoverTopLadderVehicles,
            layoverBottomLadderVehicles,
            ladderVehicles,
          ])
            .filter(notOverload)
            .map((ladderVehicle) => (
              <ScheduledLine
                key={`line-${ladderVehicle.vehicle.id}`}
                ladderVehicle={ladderVehicle}
              />
            ))}
        {layoverTopLadderVehicles.map((ladderVehicle) => (
          <VehicleSvg
            key={`vehicle-${ladderVehicle.vehicle.id}`}
            ladderVehicle={ladderVehicle}
            selectedVehicleId={selectedVehicleId}
            isLayingOver={true}
            displayCrowding={displayCrowding}
          />
        ))}
        {layoverBottomLadderVehicles.map((ladderVehicle) => (
          <VehicleSvg
            key={`vehicle-${ladderVehicle.vehicle.id}`}
            ladderVehicle={ladderVehicle}
            selectedVehicleId={selectedVehicleId}
            isLayingOver={true}
            displayCrowding={displayCrowding}
          />
        ))}
        {unselectedLadderVehicles.map((ladderVehicle) => (
          <VehicleSvg
            key={`vehicle-${ladderVehicle.vehicle.id}`}
            ladderVehicle={ladderVehicle}
            selectedVehicleId={selectedVehicleId}
            isLayingOver={false}
            displayCrowding={displayCrowding}
          />
        ))}
        {/* Display the selected vehicle on top of all others if there is one */}
        {selectedLadderVehicles.map((ladderVehicle) => (
          <VehicleSvg
            key={`vehicle-${ladderVehicle.vehicle.id}`}
            ladderVehicle={ladderVehicle}
            selectedVehicleId={selectedVehicleId}
            isLayingOver={false}
            displayCrowding={displayCrowding}
          />
        ))}
        <RoadLines height={height} />
        {orderedTimepoints.map((timepoint: Timepoint, index: number) => {
          const y = timepointSpacingY * index
          return (
            <LadderTimepoint key={timepoint.id} timepoint={timepoint} y={y} />
          )
        })}
      </svg>
    </div>
  )
}

const VehicleSvg = ({
  displayCrowding,
  ladderVehicle,
  selectedVehicleId,
  isLayingOver,
}: {
  displayCrowding: boolean | undefined
  ladderVehicle: LadderVehicle
  selectedVehicleId: VehicleId | undefined
  isLayingOver: boolean
}) => {
  displayCrowding = !!displayCrowding && isVehicle(ladderVehicle.vehicle)
  const { vehicle, x, y, vehicleDirection } = ladderVehicle
  const [{ userSettings }, dispatch] = useContext(StateDispatchContext)
  const selectedClass = vehicle.id === selectedVehicleId ? "selected" : ""
  const alertIconStyle = blockWaiverAlertStyle(vehicle)

  const crowding = isVehicle(vehicle) ? vehicle.crowding : null
  const occupancyStatus: OccupancyStatus = crowding
    ? crowding.occupancyStatus
    : "NO_DATA"

  return (
    <VehicleTooltip vehicleOrGhost={vehicle}>
      <g
        className={`m-ladder__vehicle ${selectedClass} `}
        transform={`translate(${x},${y})`}
        onClick={() => dispatch(selectVehicle(vehicle))}
      >
        {displayCrowding ? (
          <CrowdingIconSvgNode
            size={Size.Small}
            orientation={orientationMatchingVehicle(
              isLayingOver,
              vehicleDirection
            )}
            label={crowdingLabel(vehicle as Vehicle)}
            occupancyStatus={occupancyStatus}
          />
        ) : (
          <VehicleIconSvgNode
            size={isLayingOver ? Size.Small : Size.Medium}
            orientation={orientationMatchingVehicle(
              isLayingOver,
              vehicleDirection
            )}
            label={vehicleLabel(vehicle, userSettings)}
            variant={vehicle.viaVariant}
            status={drawnStatus(vehicle)}
            alertIconStyle={alertIconStyle}
            userSettings={userSettings}
          />
        )}
      </g>
    </VehicleTooltip>
  )
}

// The long vertical lines on the sides of the ladder
const RoadLines = ({ height }: { height: number }) => (
  <>
    <line
      className="m-ladder__line"
      x1={-CENTER_TO_LINE}
      y1="0"
      x2={-CENTER_TO_LINE}
      y2={height - MARGIN_TOP_BOTTOM * 2}
    />
    <line
      className="m-ladder__line"
      x1={CENTER_TO_LINE}
      y1="0"
      x2={CENTER_TO_LINE}
      y2={height - MARGIN_TOP_BOTTOM * 2}
    />
  </>
)

const LadderTimepoint = React.memo(
  ({ timepoint, y }: { timepoint: Timepoint; y: number }) => (
    <>
      <circle
        className="m-ladder__stop-circle"
        cx={-CENTER_TO_LINE}
        cy={y}
        r="3"
      />
      <circle
        className="m-ladder__stop-circle"
        cx={CENTER_TO_LINE}
        cy={y}
        r="3"
      />
      <Tippy
        content={timepoint.name}
        trigger="click"
        className="m-ladder__timepoint-name-tooltip"
      >
        <text
          className="m-ladder__timepoint-name"
          x="0"
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {timepoint.id}
        </text>
      </Tippy>
    </>
  )
)

/** timepoints should be ordered top to bottom */
const timepointStatusYFromTimepoints =
  (timepoints: Timepoint[], timepointSpacingY: number) =>
  (
    timepointStatus: VehicleTimepointStatus | null,
    direction: VehicleDirection
  ): number => {
    if (timepointStatus) {
      const timepointIndex = timepoints.findIndex(
        (timepoint) => timepoint.id === timepointStatus.timepointId
      )
      if (timepointIndex !== -1) {
        const fractionDirection = direction === VehicleDirection.Up ? +1 : -1
        return (
          timepointSpacingY *
          (timepointIndex +
            timepointStatus.fractionUntilTimepoint * fractionDirection)
        )
      }
    }
    return 0
  }

const orientationMatchingVehicle = (
  isLayingOver: boolean,
  vehicleDirection: VehicleDirection
): Orientation => {
  if (isLayingOver) {
    return vehicleDirection === VehicleDirection.Down
      ? Orientation.Left
      : Orientation.Right
  } else {
    return vehicleDirection === VehicleDirection.Down
      ? Orientation.Down
      : Orientation.Up
  }
}

const ScheduledLine = ({
  ladderVehicle: { vehicle, x, y, scheduledY, scheduledVehicleDirection },
}: {
  ladderVehicle: LadderVehicle
}) => {
  const [{ userSettings }] = useContext(StateDispatchContext)

  const status = drawnStatus(vehicle)
  if (
    scheduledY === undefined ||
    status === "off-course" ||
    status === "ghost"
  ) {
    return null
  }

  const roadLineX =
    scheduledVehicleDirection === VehicleDirection.Up
      ? CENTER_TO_LINE
      : -CENTER_TO_LINE

  return (
    <line
      className={className(
        ["m-ladder__scheduled-line"].concat(
          statusClasses(status, userSettings.vehicleAdherenceColors)
        )
      )}
      x1={x}
      y1={y}
      x2={roadLineX}
      y2={scheduledY}
    />
  )
}

export default Ladder
