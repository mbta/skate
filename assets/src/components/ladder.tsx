import React, { useContext } from "react"
import DispatchContext from "../contexts/dispatchContext"
import { Timepoint, Vehicle, VehicleId } from "../skate"
import { selectVehicle } from "../state"

// Timepoints come from the API in the ZeroToOne direction
export enum LadderDirection {
  ZeroToOne,
  OneToZero,
}

export const flipLadderDirection = (
  ladderDirection: LadderDirection
): LadderDirection =>
  ladderDirection === LadderDirection.ZeroToOne
    ? LadderDirection.OneToZero
    : LadderDirection.ZeroToOne

const HEIGHT = 500
const WIDTH = 180
const CENTER_TO_LINE = 40 // x-distance between the center of the ladder and the center of the line
const MARGIN_TOP_BOTTOM = 40 // space between the top of the route and the top of the viewbox

export interface Props {
  timepoints: Timepoint[]
  vehicles: Vehicle[]
  ladderDirection: LadderDirection
  selectedVehicleId: VehicleId | undefined
}

const Ladder = ({
  timepoints,
  vehicles,
  ladderDirection,
  selectedVehicleId,
}: Props) => {
  // (0, 0) is in the center of the first timepoint
  const viewBox = [-WIDTH / 2, -MARGIN_TOP_BOTTOM, WIDTH, HEIGHT].join(" ")
  const timepointSpacingY =
    (HEIGHT - MARGIN_TOP_BOTTOM * 2) / (timepoints.length - 1)

  const orderedTimepoints: Timepoint[] =
    // Use slice to make a copy of the array before destructively reversing
    ladderDirection === LadderDirection.OneToZero
      ? timepoints.slice().reverse()
      : timepoints

  return (
    <svg className="m-ladder" height={HEIGHT} width={WIDTH} viewBox={viewBox}>
      <RoadLines />
      {orderedTimepoints.map((timepoint: Timepoint, index: number) => {
        const y = timepointSpacingY * index
        return (
          <LadderTimepoint key={timepoint.id} timepoint={timepoint} y={y} />
        )
      })}
      {vehicles.map((vehicle: Vehicle) => (
        <LadderVehicle
          key={vehicle.id}
          vehicle={vehicle}
          timepoints={orderedTimepoints}
          timepointSpacingY={timepointSpacingY}
          ladderDirection={ladderDirection}
          selectedVehicleId={selectedVehicleId}
        />
      ))}
    </svg>
  )
}

// The long vertical lines on the sides of the ladder
const RoadLines = () => (
  <>
    <line
      className="m-ladder__line"
      x1={-CENTER_TO_LINE}
      y1="0"
      x2={-CENTER_TO_LINE}
      y2={HEIGHT - MARGIN_TOP_BOTTOM * 2}
    />
    <line
      className="m-ladder__line"
      x1={CENTER_TO_LINE}
      y1="0"
      x2={CENTER_TO_LINE}
      y2={HEIGHT - MARGIN_TOP_BOTTOM * 2}
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
    >
      {timepoint.id}
    </text>
  </>
)

const LadderVehicle = ({
  vehicle,
  timepoints,
  timepointSpacingY,
  ladderDirection,
  selectedVehicleId,
}: {
  vehicle: Vehicle
  timepoints: Timepoint[]
  timepointSpacingY: number
  ladderDirection: LadderDirection
  selectedVehicleId: VehicleId | undefined
}) => {
  const dispatch = useContext(DispatchContext)
  const vehicleDirection: VehicleDirection =
    (vehicle.direction_id === 1) ===
    (ladderDirection === LadderDirection.ZeroToOne)
      ? VehicleDirection.Down
      : VehicleDirection.Up
  const centerOfVehicleGroupX = 16
  const centerOfVehicleGroupY = 13
  const widthOfVehicleGroup = centerOfVehicleGroupX * 2
  const x =
    vehicleDirection === VehicleDirection.Up ? 47 : -(48 + widthOfVehicleGroup)
  const y =
    yForVehicle(vehicle, timepoints, timepointSpacingY, vehicleDirection) || -10
  const isSelected = vehicle.id === selectedVehicleId

  const rotation = vehicleDirection === VehicleDirection.Down ? 180 : 0

  return (
    <g
      className="m-ladder__vehicle"
      transform={`translate(${x},${y}) rotate(${rotation},${centerOfVehicleGroupX},${centerOfVehicleGroupY})`}
      onClick={() => dispatch(selectVehicle(vehicle.id))}
    >
      <Triangle isSelected={isSelected} />
      <VehicleLabel vehicle={vehicle} rotation={rotation} x={0} y={26} />
    </g>
  )
}

enum VehicleDirection {
  Up,
  Down,
}

const yForVehicle = (
  vehicle: Vehicle,
  timepoints: Timepoint[],
  timepointSpacingY: number,
  direction: VehicleDirection
): number | null => {
  const timepoint_status = vehicle.timepoint_status
  if (timepoint_status) {
    const timepointIndex = timepoints.findIndex(
      timepoint => timepoint.id === timepoint_status.timepoint_id
    )
    if (timepointIndex !== -1) {
      const fractionDirection = direction === VehicleDirection.Up ? +1 : -1
      return (
        timepointSpacingY *
        (timepointIndex +
          timepoint_status.fraction_until_timepoint * fractionDirection)
      )
    }
  }
  return null
}

const Triangle = ({ isSelected }: { isSelected: boolean }) => {
  const selectedClass = isSelected ? "selected" : ""
  return (
    <g className="m-ladder__vehicle-icon" transform={`scale(0.625)`}>
      <path
        className={`m-ladder__vehicle-triangle ${selectedClass}`}
        d="m27.34 9.46 16.84 24.54a4.06 4.06 0 0 1 -1 5.64 4.11 4.11 0 0 1 -2.3.71h-33.72a4.06 4.06 0 0 1 -4.06-4.11 4 4 0 0 1 .72-2.24l16.84-24.54a4.05 4.05 0 0 1 5.64-1.05 4 4 0 0 1 1.04 1.05z"
      />
    </g>
  )
}

const VehicleLabel = ({
  vehicle,
  rotation,
  x,
  y,
}: {
  vehicle: Vehicle
  rotation: number
  x: number
  y: number
}) => (
  <svg className="m-ladder__vehicle-label" x={x} y={y}>
    <rect
      className="m-ladder__vehicle-label-background"
      rx="5.5"
      ry="5.5"
      width="30"
      height="11"
    />
    <text
      className="m-ladder__vehicle-label-text"
      textAnchor="inherit"
      x="5"
      y="9"
      transform={`rotate(${rotation},15,6)`}
    >
      {vehicle.label}
    </text>
  </svg>
)

export default Ladder
