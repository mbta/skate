import React, { ReactElement } from "react"
import { className } from "../helpers/dom"
import { classModifierForStatus, OccupancyStatus } from "../models/crowding"
import {
  Label,
  Orientation,
  scaleForSize,
  Size,
  sizeClassSuffix,
} from "./vehicleIcon"

interface Props {
  size: Size
  orientation: Orientation
  label?: string
  occupancyStatus: OccupancyStatus
}

const Crowd = ({ size, orientation, occupancyStatus }: Props) => {
  const scale = scaleForSize(size)
  const yOffset =
    size === Size.Small ? 0 : orientation === Orientation.Up ? -5 : 5

  const classNames = [
    "m-ladder__crowding",
    `m-ladder__crowding--${classModifierForStatus(occupancyStatus)}`,
  ]

  return (
    <g
      transform={`scale(${scale}) translate(-24,${yOffset - 22})`}
      className={className(classNames)}
    >
      <path d="M6.74,16.17A6.86,6.86,0,0,0-.12,23h0V40.8a3.43,3.43,0,0,0,3.43,3.42h6.86a3.42,3.42,0,0,0,3.42-3.42V23A6.87,6.87,0,0,0,6.74,16.17Z" />
      <circle cx="6.74" cy="8.54" r="4.93" />
      <path d="M23.88,16.17A6.86,6.86,0,0,0,17,23h0V40.8a3.43,3.43,0,0,0,3.43,3.42h6.86a3.43,3.43,0,0,0,3.43-3.42V23a6.86,6.86,0,0,0-6.86-6.86Z" />
      <circle cx="23.88" cy="8.48" r="4.93" />
      <path d="M41,16.17A6.87,6.87,0,0,0,34.17,23V40.8a3.42,3.42,0,0,0,3.42,3.42h6.86a3.43,3.43,0,0,0,3.43-3.42V23A6.86,6.86,0,0,0,41,16.17Z" />
      <circle cx="41.03" cy="8.48" r="4.93" />
    </g>
  )
}

export const CrowdingIconSvgNode = ({
  size,
  orientation,
  label,
  occupancyStatus,
}: Props): ReactElement<SVGElement> => {
  const classes: string[] = [
    "m-vehicle-icon",
    `m-vehicle-icon${sizeClassSuffix(size)}`,
  ]
  return (
    <g className={className(classes)}>
      {label ? (
        <Label size={size} orientation={orientation} label={label} />
      ) : null}
      <Crowd
        size={size}
        orientation={orientation}
        occupancyStatus={occupancyStatus}
      />
    </g>
  )
}

