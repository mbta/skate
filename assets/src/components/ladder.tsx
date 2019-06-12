import React, { useContext } from "react"
import DispatchContext from "../contexts/dispatchContext"
import { Timepoint, Vehicle, VehicleId, VehicleTimepointStatus } from "../skate"
import { selectVehicle } from "../state"
import { Orientation, Size, VehicleIconSvgNode } from "./vehicleIcon"

// Timepoints come from the API in the ZeroToOne direction
export enum LadderDirection {
  ZeroToOne,
  OneToZero,
}

export enum VehicleDirection {
  Up,
  Down,
}

export const vehicleDirectionOnLadder = (
  vehicle: Vehicle,
  ladderDirection: LadderDirection
): VehicleDirection =>
  (vehicle.directionId === 1) ===
  (ladderDirection === LadderDirection.ZeroToOne)
    ? VehicleDirection.Down
    : VehicleDirection.Up

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
      <RoadLines />
      {orderedTimepoints.map((timepoint: Timepoint, index: number) => {
        const y = timepointSpacingY * index
        return (
          <LadderTimepoint key={timepoint.id} timepoint={timepoint} y={y} />
        )
      })}
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
  const vehicleDirection: VehicleDirection = vehicleDirectionOnLadder(
    vehicle,
    ladderDirection
  )
  const x = vehicleDirection === VehicleDirection.Up ? 63 : -63
  const vehicleY =
    timepointStatusY(
      vehicle.timepointStatus,
      timepoints,
      timepointSpacingY,
      vehicleDirection
    ) || -10
  const roadLineX =
    vehicleDirection === VehicleDirection.Up ? CENTER_TO_LINE : -CENTER_TO_LINE
  const scheduledY = timepointStatusY(
    vehicle.scheduledTimepointStatus,
    timepoints,
    timepointSpacingY,
    vehicleDirection
  )
  const selectedClass = vehicle.id === selectedVehicleId ? "selected" : ""

  const orientation =
    vehicleDirection === VehicleDirection.Down
      ? Orientation.Down
      : Orientation.Up

  return (
    <g>
      {scheduledY && (
        <ScheduledLine
          vehicleX={x}
          vehicleY={vehicleY}
          roadLineX={roadLineX}
          scheduledY={scheduledY}
        />
      )}
      <g
        className={`m-ladder__vehicle ${selectedClass}`}
        transform={`translate(${x},${vehicleY})`}
        onClick={() => dispatch(selectVehicle(vehicle.id))}
      >
        <VehicleIconSvgNode
          size={Size.Medium}
          orientation={orientation}
          label={vehicle.label}
          variant={vehicle.viaVariant}
        />
      </g>
    </g>
  )
}

const timepointStatusY = (
  timepointStatus: VehicleTimepointStatus | null,
  timepoints: Timepoint[],
  timepointSpacingY: number,
  direction: VehicleDirection
): number | null => {
  if (timepointStatus) {
    const timepointIndex = timepoints.findIndex(
      timepoint => timepoint.id === timepointStatus.timepointId
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
  return null
}

const ScheduledLine = ({
  vehicleX,
  vehicleY,
  roadLineX,
  scheduledY,
}: {
  vehicleX: number
  vehicleY: number
  roadLineX: number
  scheduledY: number
}) => (
  <line
    className="m-ladder__scheduled-line"
    x1={vehicleX}
    y1={vehicleY}
    x2={roadLineX}
    y2={scheduledY}
  />
)

export default Ladder
