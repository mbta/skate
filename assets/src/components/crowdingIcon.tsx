import React, { ReactElement } from "react"
import { joinClasses } from "../helpers/dom"
import { classModifierForStatus, OccupancyStatus } from "../models/crowding"
import {
  Label,
  Orientation,
  scaleForSize,
  Size,
  sizeClassSuffix,
  viewBox,
} from "./vehicleIcon"

interface Props {
  size: Size
  orientation: Orientation
  label?: string
  occupancyStatus: OccupancyStatus
  isLayingOver?: boolean
}

export const CrowdingIcon = React.memo(
  (props: Props): ReactElement<HTMLElement> => {
    const { left, top, width, height } = viewBox(props)
    return (
      <svg
        style={{ width, height }}
        viewBox={`${left} ${top} ${width} ${height}`}
      >
        <CrowdingIconSvgNode {...props} />
      </svg>
    )
  }
)

const Crowd = React.memo(
  ({ size, orientation, occupancyStatus, isLayingOver }: Props) => {
    const scale = scaleForSize(size)
    const useDownwardOrientation =
      orientation === Orientation.Down || isLayingOver
    let yOffset = size === Size.Small ? 8 : 5
    if (!useDownwardOrientation) {
      yOffset = -yOffset
    }
    const classNames = [
      "m-ladder__crowding",
      `m-ladder__crowding--${classModifierForStatus(occupancyStatus)}`,
    ]

    return (
      <g
        transform={`scale(${scale}) translate(-24,${yOffset - 22})`}
        className={joinClasses(classNames)}
      >
        <rect x="-2" y="-2" width="52" height="52" fill="transparent" />
        <path d="M6.74,16.17A6.86,6.86,0,0,0-.12,23h0V40.8a3.43,3.43,0,0,0,3.43,3.42h6.86a3.42,3.42,0,0,0,3.42-3.42V23A6.87,6.87,0,0,0,6.74,16.17Z" />
        <circle cx="6.74" cy="8.54" r="4.93" />
        <path d="M23.88,16.17A6.86,6.86,0,0,0,17,23h0V40.8a3.43,3.43,0,0,0,3.43,3.42h6.86a3.43,3.43,0,0,0,3.43-3.42V23a6.86,6.86,0,0,0-6.86-6.86Z" />
        <circle cx="23.88" cy="8.48" r="4.93" />
        <path d="M41,16.17A6.87,6.87,0,0,0,34.17,23V40.8a3.42,3.42,0,0,0,3.42,3.42h6.86a3.43,3.43,0,0,0,3.43-3.42V23A6.86,6.86,0,0,0,41,16.17Z" />
        <circle cx="41.03" cy="8.48" r="4.93" />
      </g>
    )
  }
)

export const CrowdingIconSvgNode = React.memo(
  ({
    size,
    orientation,
    label,
    occupancyStatus,
    isLayingOver,
  }: Props): ReactElement<SVGElement> => {
    const classes: string[] = [
      "c-vehicle-icon",
      `c-vehicle-icon${sizeClassSuffix(size)}`,
    ]
    return (
      <g className={joinClasses(classes)}>
        {label ? (
          <Label size={size} orientation={orientation} label={label} />
        ) : null}
        <Crowd
          size={size}
          orientation={orientation}
          occupancyStatus={occupancyStatus}
          isLayingOver={isLayingOver}
        />
      </g>
    )
  }
)

export default CrowdingIcon
