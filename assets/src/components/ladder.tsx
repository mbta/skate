import useComponentSize from "@rehooks/component-size"
import React, { useContext, useRef } from "react"
import ReactTooltip from "react-tooltip"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { flatten, partition } from "../helpers/array"
import vehicleLabel from "../helpers/vehicleLabel"
import featureIsEnabled from "../laboratoryFeatures"
import { blockWaiverAlertStyle } from "../models/blockWaiver"
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
import { drawnStatus, statusClass } from "../models/vehicleStatus"
import { Vehicle, VehicleId, VehicleTimepointStatus } from "../realtime.d"
import { Timepoint } from "../schedule.d"
import { selectVehicle } from "../state"
import HeadwayLines from "./headwayLines"
import {
  CrowdingIconSvgNode,
  Orientation,
  Size,
  VehicleIconSvgNode,
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
  const layoverBottomLadderVehicles: LadderVehicle[] = ladderVehiclesForLayovers(
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
          <VehicleOrCrowdingSvg
            key={`vehicle-${ladderVehicle.vehicle.id}`}
            ladderVehicle={ladderVehicle}
            selectedVehicleId={selectedVehicleId}
            isLayingOver={true}
            displayCrowding={displayCrowding}
          />
        ))}
        {layoverBottomLadderVehicles.map((ladderVehicle) => (
          <VehicleOrCrowdingSvg
            key={`vehicle-${ladderVehicle.vehicle.id}`}
            ladderVehicle={ladderVehicle}
            selectedVehicleId={selectedVehicleId}
            isLayingOver={true}
            displayCrowding={displayCrowding}
          />
        ))}
        {unselectedLadderVehicles.map((ladderVehicle) => (
          <VehicleOrCrowdingSvg
            key={`vehicle-${ladderVehicle.vehicle.id}`}
            ladderVehicle={ladderVehicle}
            selectedVehicleId={selectedVehicleId}
            isLayingOver={false}
            displayCrowding={displayCrowding}
          />
        ))}
        {/* Display the selected vehicle on top of all others if there is one */}
        {selectedLadderVehicles.map((ladderVehicle) => (
          <VehicleOrCrowdingSvg
            key={`vehicle-${ladderVehicle.vehicle.id}`}
            ladderVehicle={ladderVehicle}
            selectedVehicleId={selectedVehicleId}
            isLayingOver={false}
            displayCrowding={displayCrowding}
          />
        ))}
        <RoadLines height={height} />
        {featureIsEnabled("headway_ladder_colors") && (
          <HeadwayLines
            height={height - MARGIN_TOP_BOTTOM * 2}
            ladderVehicles={ladderVehicles}
          />
        )}
        {orderedTimepoints.map((timepoint: Timepoint, index: number) => {
          const y = timepointSpacingY * index
          return (
            <LadderTimepoint key={timepoint.id} timepoint={timepoint} y={y} />
          )
        })}
      </svg>
      <ReactTooltip effect="solid" globalEventOff="click" />
    </div>
  )
}

const associatedVehicleId = (
  vehicleOrIncomingGhostVehicleId: string
): string => {
  const ghostIncomingRegex = /^ghost\-incoming\-/
  return vehicleOrIncomingGhostVehicleId.replace(ghostIncomingRegex, "")
}

const VehicleOrCrowdingSvg = ({
  ladderVehicle,
  selectedVehicleId,
  isLayingOver,
  displayCrowding,
}: {
  ladderVehicle: LadderVehicle
  selectedVehicleId: VehicleId | undefined
  isLayingOver: boolean
  displayCrowding?: boolean
}) => {
  const useCrowdingIcon = displayCrowding && isVehicle(ladderVehicle.vehicle)
  return useCrowdingIcon ? (
    <CrowdingSvg
      ladderVehicle={ladderVehicle}
      selectedVehicleId={selectedVehicleId}
      isLayingOver={isLayingOver}
    />
  ) : (
    <VehicleSvg
      ladderVehicle={ladderVehicle}
      selectedVehicleId={selectedVehicleId}
      isLayingOver={isLayingOver}
    />
  )
}

const CrowdingSvg = ({
  ladderVehicle,
  selectedVehicleId,
  isLayingOver,
}: {
  ladderVehicle: LadderVehicle
  selectedVehicleId: VehicleId | undefined
  isLayingOver: boolean
}) => {
  const { vehicle, x, y, vehicleDirection } = ladderVehicle
  const selectedClass = vehicle.id === selectedVehicleId ? "selected" : ""
  const [{}, dispatch] = useContext(StateDispatchContext)

  return (
    <g
      className={`m-ladder__vehicle ${selectedClass} `}
      transform={`translate(${x},${y})`}
      onClick={() => dispatch(selectVehicle(associatedVehicleId(vehicle.id)))}
    >
      <CrowdingIconSvgNode
        size={isLayingOver ? Size.Small : Size.Medium}
        orientation={orientationMatchingVehicle(isLayingOver, vehicleDirection)}
        label={crowdingLabel(vehicle as Vehicle)}
      />
    </g>
  )
}

const crowdingLabel = (vehicle: Vehicle): string => {
  if (vehicle.crowding && vehicle.crowding.load !== null) {
    return `${vehicle.crowding.load}/${vehicle.crowding.capacity}`
  } else {
    return "NO DATA"
  }
}

const VehicleSvg = ({
  ladderVehicle,
  selectedVehicleId,
  isLayingOver,
}: {
  ladderVehicle: LadderVehicle
  selectedVehicleId: VehicleId | undefined
  isLayingOver: boolean
}) => {
  const { vehicle, x, y, vehicleDirection } = ladderVehicle
  const [{ settings }, dispatch] = useContext(StateDispatchContext)
  const selectedClass = vehicle.id === selectedVehicleId ? "selected" : ""
  const alertIconStyle = blockWaiverAlertStyle(vehicle)

  return (
    <g
      className={`m-ladder__vehicle ${selectedClass} `}
      transform={`translate(${x},${y})`}
      onClick={() => dispatch(selectVehicle(associatedVehicleId(vehicle.id)))}
    >
      <VehicleIconSvgNode
        size={isLayingOver ? Size.Small : Size.Medium}
        orientation={orientationMatchingVehicle(isLayingOver, vehicleDirection)}
        label={vehicleLabel(vehicle, settings)}
        variant={vehicle.viaVariant}
        status={drawnStatus(vehicle)}
        alertIconStyle={alertIconStyle}
      />
    </g>
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

const LadderTimepoint = ({
  timepoint,
  y,
}: {
  timepoint: Timepoint
  y: number
}) => (
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
    <text
      className="m-ladder__timepoint-name"
      x="0"
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      data-tip={timepoint.name}
      data-event="click"
    >
      {timepoint.id}
    </text>
  </>
)

/** timepoints should be ordered top to bottom */
const timepointStatusYFromTimepoints = (
  timepoints: Timepoint[],
  timepointSpacingY: number
) => (
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
      className={`m-ladder__scheduled-line ${statusClass(status)}`}
      x1={x}
      y1={y}
      x2={roadLineX}
      y2={scheduledY}
    />
  )
}

export default Ladder
