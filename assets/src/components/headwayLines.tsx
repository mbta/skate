import React, { ReactElement } from "react"
import { LadderVehicle, VehicleDirection } from "../models/ladderVehicle"
import { HeadwaySpacing } from "../skate"
import { CENTER_TO_LINE } from "./ladder"

interface Props {
  ladderVehicles: LadderVehicle[]
}

const headwayClass = (spacing: HeadwaySpacing | null): string =>
  spacing ? `m-ladder__headway-line--${spacing.replace("_", "-")}` : ""

const drawHeadwayLine = (
  ladderVehicles: LadderVehicle[],
  yStart: number,
  acc: Array<ReactElement<SVGPathElement>>
): Array<ReactElement<SVGPathElement>> => {
  if (ladderVehicles.length === 0) {
    return acc
  }

  const [currentVehicle, ...rest] = ladderVehicles

  const centerToLine =
    currentVehicle.vehicleDirection === VehicleDirection.Down
      ? -CENTER_TO_LINE
      : CENTER_TO_LINE

  const newAcc = acc.concat([
    <line
      key={`${currentVehicle.vehicleId}-headway-line`}
      className={`m-ladder__line
                  m-ladder__headway-line
                  ${headwayClass(currentVehicle.headwaySpacing)}`}
      x1={centerToLine}
      y1={yStart}
      x2={centerToLine}
      y2={currentVehicle.y}
    />,
  ])

  return drawHeadwayLine(rest, currentVehicle.y, newAcc)
}

const HeadwayLines = ({
  ladderVehicles,
}: Props): ReactElement<HTMLDivElement> => (
  <g className="m-ladder__headway-lines">
    {drawHeadwayLine(ladderVehicles.reverse(), 0, [])}
  </g>
)

export default HeadwayLines
