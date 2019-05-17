import React, { useContext } from "react"
import DispatchContext from "../contexts/dispatchContext"
import { Timepoint, TimepointId, Vehicle, VehicleId } from "../skate"
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
const CENTER_TO_VEHICLE = 60 // x-distance between the center of the ladder and the center of the vehicles
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
  const x =
    vehicleDirection === VehicleDirection.Up
      ? CENTER_TO_VEHICLE
      : -CENTER_TO_VEHICLE
  const y =
    yForVehicle(vehicle, timepoints, timepointSpacingY, vehicleDirection) || -10
  const textY = vehicleDirection === VehicleDirection.Up ? y + 18 : y - 15
  const isSelected = vehicle.id === selectedVehicleId

  return (
    <g
      className="m-ladder__vehicle"
      onClick={() => dispatch(selectVehicle(vehicle.id))}
    >
      <Triangle
        x={x}
        y={y}
        vehicleDirection={vehicleDirection}
        isSelected={isSelected}
      />
      <text
        className="m-ladder__vehicle-label"
        x={x}
        y={textY}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {vehicle.label}
      </text>
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
    const timepoint_id: TimepointId | null = timepoint_status.timepoint_id
    if (timepoint_id) {
      const timepointIndex = timepoints.findIndex(
        timepoint => timepoint.id === timepoint_id
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
  }
  return null
}

const Triangle = ({
  x,
  y,
  vehicleDirection,
  isSelected,
}: {
  x: number
  y: number
  vehicleDirection: VehicleDirection
  isSelected: boolean
}) => {
  const points =
    vehicleDirection === VehicleDirection.Up
      ? [[x, y - 10], [x - 15, y + 10], [x + 15, y + 10]]
      : [[x, y + 10], [x + 15, y - 10], [x - 15, y - 10]]
  const pointsString = points.map(xy => xy.join(",")).join(" ")
  const selectedClass = isSelected ? "selected" : ""
  return (
    <polygon
      className={`m-ladder__vehicle-triangle ${selectedClass}`}
      points={pointsString}
    />
  )
}

export default Ladder
