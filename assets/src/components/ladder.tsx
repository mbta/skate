import useComponentSize from "@rehooks/component-size"
import React, { useContext, useRef } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { partition } from "../helpers/array"
import vehicleLabel from "../helpers/vehicleLabel"
import featureIsEnabled from "../laboratoryFeatures"
import {
  LadderDirection,
  orderTimepoints,
  VehicleDirection,
} from "../models/ladderDirection"
import {
  LadderVehicle,
  ladderVehiclesFromVehicles,
} from "../models/ladderVehicle"
import { isGhost } from "../models/vehicle"
import { statusClass } from "../models/vehicleStatus"
import {
  Vehicle,
  VehicleId,
  VehicleOrGhost,
  VehicleTimepointStatus,
} from "../realtime.d"
import { TimepointId } from "../schedule.d"
import { selectVehicle } from "../state"
import HeadwayLines from "./headwayLines"
import { Orientation, Size, VehicleIconSvgNode } from "./vehicleIcon"

export interface Props {
  timepoints: TimepointId[]
  vehiclesAndGhosts: VehicleOrGhost[]
  ladderDirection: LadderDirection
  selectedVehicleId?: VehicleId
}

export type TimepointStatusYFunc = (
  timepointStatus: VehicleTimepointStatus | null,
  direction: VehicleDirection
) => number

export const CENTER_TO_LINE = 40 // x-distance between the center of the ladder and the center of the line
const MARGIN_TOP_BOTTOM = 20 // space between the top of the route and the top of the viewbox

const Ladder = ({
  timepoints,
  vehiclesAndGhosts,
  ladderDirection,
  selectedVehicleId,
}: Props) => {
  const elementRef = useRef(null)
  const { height } = useComponentSize(elementRef)

  const orderedTimepoints: TimepointId[] = orderTimepoints(
    timepoints,
    ladderDirection
  )

  const timepointSpacingY: number =
    (height - MARGIN_TOP_BOTTOM * 2) / (timepoints.length - 1)
  const timepointStatusY = timepointStatusYFromTimepoints(
    orderedTimepoints,
    timepointSpacingY
  )

  const vehiclesWithAnActiveBlock = vehiclesAndGhosts.filter(withAnActiveBlock)

  const { ladderVehicles, widthOfLanes } = ladderVehiclesFromVehicles(
    vehiclesWithAnActiveBlock,
    ladderDirection,
    timepointStatusY
  )
  const [selectedLadderVehicles, unselectedLadderVehicles] = partition(
    ladderVehicles,
    ladderVehicle => ladderVehicle.vehicleId === selectedVehicleId
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
        {ladderVehicles.map(ladderVehicle => (
          <ScheduledLine
            key={`line-${ladderVehicle.vehicleId}`}
            ladderVehicle={ladderVehicle}
          />
        ))}
        {unselectedLadderVehicles.map(ladderVehicle => (
          <VehicleSvg
            key={`vehicle-${ladderVehicle.vehicleId}`}
            ladderVehicle={ladderVehicle}
            selectedVehicleId={selectedVehicleId}
          />
        ))}
        {/* Display the selected vehicle on top of all others if there is one */}
        {selectedLadderVehicles.map(ladderVehicle => (
          <VehicleSvg
            key={`vehicle-${ladderVehicle.vehicleId}`}
            ladderVehicle={ladderVehicle}
            selectedVehicleId={selectedVehicleId}
          />
        ))}
        <RoadLines height={height} />
        {featureIsEnabled("headway_ladder_colors") && (
          <HeadwayLines
            height={height - MARGIN_TOP_BOTTOM * 2}
            ladderVehicles={ladderVehicles}
          />
        )}
        {orderedTimepoints.map((timepointId: TimepointId, index: number) => {
          const y = timepointSpacingY * index
          return (
            <LadderTimepoint
              key={timepointId}
              timepointId={timepointId}
              y={y}
            />
          )
        })}
      </svg>
    </div>
  )
}

const VehicleSvg = ({
  ladderVehicle,
  selectedVehicleId,
}: {
  ladderVehicle: LadderVehicle
  selectedVehicleId: VehicleId | undefined
}) => {
  const {
    vehicleId,
    viaVariant,
    status,
    x,
    y,
    vehicleDirection,
  } = ladderVehicle
  const [{ settings }, dispatch] = useContext(StateDispatchContext)
  const selectedClass = vehicleId === selectedVehicleId ? "selected" : ""

  return (
    <g>
      <g
        className={`m-ladder__vehicle ${selectedClass}`}
        transform={`translate(${x},${y})`}
        onClick={() => dispatch(selectVehicle(vehicleId))}
      >
        <VehicleIconSvgNode
          size={Size.Medium}
          orientation={orientationMatchingVehicle(vehicleDirection)}
          label={vehicleLabel(
            {
              id: ladderVehicle.vehicleId,
              label: ladderVehicle.label,
              runId: ladderVehicle.runId,
              endOfTripType: ladderVehicle.endOfTripType || "another_trip",
            } as Vehicle,
            settings
          )}
          variant={viaVariant}
          status={status}
        />
      </g>
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
  timepointId,
  y,
}: {
  timepointId: TimepointId
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
    >
      {timepointId}
    </text>
  </>
)

/** timepoints should be ordered top to bottom */
const timepointStatusYFromTimepoints = (
  timepoints: TimepointId[],
  timepointSpacingY: number
) => (
  timepointStatus: VehicleTimepointStatus | null,
  direction: VehicleDirection
): number => {
  if (timepointStatus) {
    const timepointIndex = timepoints.findIndex(
      timepointId => timepointId === timepointStatus.timepointId
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

const withAnActiveBlock = (vehicleOrGhost: VehicleOrGhost): boolean =>
  isGhost(vehicleOrGhost) || vehicleOrGhost.blockIsActive

const orientationMatchingVehicle = (
  vehicleDirection: VehicleDirection
): Orientation =>
  vehicleDirection === VehicleDirection.Down ? Orientation.Down : Orientation.Up

const ScheduledLine = ({
  ladderVehicle: { status, x, y, scheduledY, scheduledVehicleDirection },
}: {
  ladderVehicle: LadderVehicle
}) => {
  if (!scheduledY || status === "off-course" || status === "ghost") {
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
