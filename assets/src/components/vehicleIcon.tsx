import React from "react"
import { todayIsHalloween } from "../helpers/date"
import { DrawnStatus, statusClass } from "../models/vehicleStatus"

export enum Orientation {
  Up,
  Down,
  Left,
  Right,
}

export enum Size {
  Small,
  Medium,
  Large,
}

export interface Props {
  size: Size
  orientation: Orientation
  label?: string
  variant?: string | null
  status?: DrawnStatus
}

/*
Size of the triangle for calculation of the viewbox and positioning the label
Sizes are before scaling, relative to the center of the triangle
*/
const X_CENTER_TO_SIDE = 22
const Y_CENTER_TO_POINT = 20
const Y_CENTER_TO_BASE = 20

export const VehicleIcon = (props: Props) => {
  if (
    props.status === "ghost" &&
    (props.orientation === Orientation.Left ||
      props.orientation === Orientation.Right)
  ) {
    props = {
      ...props,
      // ghosts can't be drawn sideways
      orientation:
        props.status === "ghost" ? Orientation.Up : props.orientation,
    }
  }

  const { left, top, width, height } = viewBox(props)
  return (
    <svg
      style={{ width, height }}
      viewBox={`${left} ${top} ${width} ${height}`}
    >
      <VehicleIconSvgNode {...props} />
    </svg>
  )
}

const viewBox = ({
  size,
  orientation,
  label,
}: Props): { left: number; top: number; width: number; height: number } => {
  // shrink the viewbox to fit around the triangle and label
  const scale = scaleForSize(size)
  const labelBgWidth = label ? labelBackgroundWidth(size) : 0
  const labelBgHeight = label ? labelBackgroundHeight(size) : 0
  let left = 0
  let right = 0
  let top = 0
  let bottom = 0
  switch (orientation) {
    case Orientation.Up:
      left = -scale * X_CENTER_TO_SIDE
      top = -scale * Y_CENTER_TO_POINT
      right = scale * X_CENTER_TO_SIDE
      bottom = scale * Y_CENTER_TO_BASE + labelBgHeight
      break
    case Orientation.Down:
      left = -scale * X_CENTER_TO_SIDE
      top = -scale * Y_CENTER_TO_BASE - labelBgHeight
      right = scale * X_CENTER_TO_SIDE
      bottom = scale * Y_CENTER_TO_POINT
      break
    case Orientation.Left:
      left = -scale * Y_CENTER_TO_POINT
      top = -scale * X_CENTER_TO_SIDE
      right = scale * Y_CENTER_TO_BASE
      bottom = scale * X_CENTER_TO_SIDE + labelBgHeight
      break
    case Orientation.Right:
      left = -scale * Y_CENTER_TO_BASE
      top = -scale * X_CENTER_TO_SIDE
      right = scale * Y_CENTER_TO_POINT
      bottom = scale * X_CENTER_TO_SIDE + labelBgHeight
      break
  }
  left = Math.min(left, -labelBgWidth / 2)
  right = Math.max(right, labelBgWidth / 2)
  const width = right - left
  const height = bottom - top
  return { left, top, width, height }
}

export const VehicleIconSvgNode = ({
  size,
  orientation,
  label,
  variant,
  status,
}: Props) => {
  status = status || "plain"
  variant = variant && variant !== "_" ? variant : undefined
  // ghosts can't be drawn sideways
  if (
    status === "ghost" &&
    (orientation === Orientation.Left || orientation === Orientation.Right)
  ) {
    orientation = Orientation.Up
  }
  return (
    <g
      className={`m-vehicle-icon m-vehicle-icon${sizeClassSuffix(
        size
      )} ${statusClass(status)}`}
    >
      {label ? (
        <Label size={size} orientation={orientation} label={label} />
      ) : null}
      {status === "ghost" ? (
        <Ghost size={size} variant={variant} />
      ) : status === "off-course" && todayIsHalloween() ? (
        <Bat size={size} orientation={orientation} />
      ) : (
        <Triangle size={size} orientation={orientation} />
      )}
      {variant ? (
        <Variant
          size={size}
          orientation={orientation}
          variant={variant}
          status={status}
        />
      ) : null}
    </g>
  )
}

const Triangle = ({
  size,
  orientation,
}: {
  size: Size
  orientation: Orientation
}) => {
  const scale = scaleForSize(size)
  const rotation = rotationForOrientation(orientation)
  return (
    <path
      className="m-vehicle-icon__triangle"
      d="m27.34 9.46 16.84 24.54a4.06 4.06 0 0 1 -1 5.64 4.11 4.11 0 0 1 -2.3.71h-33.72a4.06 4.06 0 0 1 -4.06-4.11 4 4 0 0 1 .72-2.24l16.84-24.54a4.05 4.05 0 0 1 5.64-1.05 4 4 0 0 1 1.04 1.05z"
      // Move the center to 0,0
      transform={`scale(${scale}) rotate(${rotation}) translate(-24,-22)`}
    />
  )
}

const Bat = ({
  size,
  orientation,
}: {
  size: Size
  orientation: Orientation
}) => {
  const scale = scaleForSize(size)
  const rotation = rotationForOrientation(orientation)
  return (
    <path
      d="m33.19 37.76a1.53 1.53 0 0 0 1.11.31 1.48 1.48 0 0 0 1-.58c1.21-1.62 2.54-2.42 3.83-2.41 2.51.06 5 2.94 5.78 4.05a1.5 1.5 0 0 0 1.55.61 1.47 1.47 0 0 0 1.12-1.23c3.27-23.76-13.42-30.31-13.58-30.37a1.47 1.47 0 0 0 -2 1.54c.58 4.94-.09 8.32-2 9.8a3.11 3.11 0 0 1 -.54.35v-5a1.47 1.47 0 1 0 -2.93 0v4.17a4.38 4.38 0 0 0 -4.81 0v-4.2a1.47 1.47 0 1 0 -2.93 0v5.2a3.79 3.79 0 0 1 -.91-.53c-1.87-1.48-2.54-4.86-2-9.8a1.47 1.47 0 0 0 -2-1.54c-.04.07-16.73 6.62-13.45 30.38a1.47 1.47 0 0 0 1.12 1.23 1.5 1.5 0 0 0 1.55-.61c.75-1.11 3.25-4 5.77-4.05 1.35 0 2.63.78 3.84 2.41a1.47 1.47 0 0 0 2.1.27s4.82-2.91 8 1.61a1.43 1.43 0 0 0 2.39-.12c1.33-2.25 3.9-4.65 7.99-1.49z"
      // Move the center to 0,0
      transform={`scale(${scale}) rotate(${rotation}) translate(-24,-22)`}
    />
  )
}

const Ghost = ({ size, variant }: { size: Size; variant?: string }) => {
  // No orientation argument, because the ghost icon is always right side up.
  const scale = scaleForSize(size)
  return (
    <g
      // Move the center to 0,0
      // The raw ghost icon is a little bigger than the raw triangle, so scale by an extra .7
      transform={`scale(${0.7 * scale}) translate(-24,-23)`}
    >
      <path
        // The outline that gets highlighted when it's selected
        className="m-vehicle-icon__ghost-highlight"
        d="m43.79 19c0-9.68-8.79-17.49-19.59-17.49s-19.6 7.81-19.6 17.49v12.88 11a2 2 0 0 0 2.55 1.87l6.78-4.09 10.27 5.92 10.26-5.88 6.78 4.09a2 2 0 0 0 2.55-1.87z"
        stroke-join="round"
      />
      <path
        className="m-vehicle-icon__ghost-body"
        d="m43.79 19c0-9.68-8.79-17.49-19.59-17.49s-19.6 7.81-19.6 17.49v12.88 11a2 2 0 0 0 2.55 1.87l6.78-4.09 10.27 5.92 10.26-5.88 6.78 4.09a2 2 0 0 0 2.55-1.87z"
        stroke-join="round"
      />
      {variant === undefined ? (
        <>
          <ellipse
            className="m-vehicle-icon__ghost-eye"
            cx="19.73"
            cy="22.8"
            rx="3.11"
            ry="3.03"
          />
          <ellipse
            className="m-vehicle-icon__ghost-eye"
            cx="35.29"
            cy="22.8"
            rx="3.11"
            ry="3.03"
          />
        </>
      ) : null}
    </g>
  )
}

const Label = ({
  size,
  orientation,
  label,
}: {
  size: Size
  orientation: Orientation
  label: string
}) => {
  const scale = scaleForSize(size)
  const labelBgWidth = labelBackgroundWidth(size)
  const labelBgHeight = labelBackgroundHeight(size)
  let labelBgTop = 0
  switch (orientation) {
    // adjust by 1 to cover any small gap between the triangle and the label
    case Orientation.Up:
      labelBgTop = scale * Y_CENTER_TO_BASE - 1
      break
    case Orientation.Down:
      labelBgTop = -scale * Y_CENTER_TO_BASE - labelBgHeight + 1
      break
    case Orientation.Left:
    case Orientation.Right:
      labelBgTop = scale * X_CENTER_TO_SIDE - 1
      break
  }
  const labelY = labelBgTop + labelBgHeight / 2

  return (
    <>
      <rect
        className="m-vehicle-icon__label-background"
        x={-labelBgWidth / 2}
        y={labelBgTop}
        width={labelBgWidth}
        height={labelBgHeight}
        rx={labelBgHeight / 2}
        ry={labelBgHeight / 2}
      />
      <text
        className="m-vehicle-icon__label"
        x="0"
        y={labelY}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {label}
      </text>
    </>
  )
}

const Variant = ({
  size,
  orientation,
  variant,
  status,
}: {
  size: Size
  orientation: Orientation
  variant: string
  status: DrawnStatus
}) => {
  const scale = scaleForSize(size)

  // space between the triangle base and the variant letter
  let margin = 0
  switch (size) {
    case Size.Small:
      margin = status === "ghost" ? 4 : 2
      break
    case Size.Medium:
      margin = status === "ghost" ? 8 : 4
      break
    case Size.Large:
      margin = status === "ghost" ? 12 : 6
      break
  }

  let variantPositionOpts = {}
  switch (orientation) {
    // anchor the variant to the center of the base (with a small margin)
    case Orientation.Up:
      variantPositionOpts = {
        dominantBaseline: "alphabetic",
        textAnchor: "middle",
        x: 0,
        y: scale * Y_CENTER_TO_BASE - margin,
      }
      break
    case Orientation.Down:
      variantPositionOpts = {
        dominantBaseline: "hanging",
        textAnchor: "middle",
        x: 0,
        y: -scale * Y_CENTER_TO_BASE + margin,
      }
      break
    case Orientation.Left:
      variantPositionOpts = {
        dominantBaseline: "central",
        textAnchor: "end",
        x: scale * Y_CENTER_TO_BASE - margin,
        y: 0,
      }
      break
    case Orientation.Right:
      variantPositionOpts = {
        dominantBaseline: "central",
        textAnchor: "start",
        x: -scale * Y_CENTER_TO_BASE + margin,
        y: 0,
      }
      break
  }
  return (
    <text className="m-vehicle-icon__variant" {...variantPositionOpts}>
      {variant}
    </text>
  )
}

const sizeClassSuffix = (size: Size): string => {
  switch (size) {
    case Size.Small:
      return "--small"
    case Size.Medium:
      return "--medium"
    case Size.Large:
      return "--large"
  }
}

const scaleForSize = (size: Size): number => {
  switch (size) {
    case Size.Small:
      return 0.38
    case Size.Medium:
      return 0.625
    case Size.Large:
      return 1
  }
}

const rotationForOrientation = (orientation: Orientation): number => {
  switch (orientation) {
    case Orientation.Up:
      return 0
    case Orientation.Down:
      return 180
    case Orientation.Left:
      return 270
    case Orientation.Right:
      return 90
  }
}

const labelBackgroundWidth = (size: Size): number => {
  switch (size) {
    case Size.Small:
    case Size.Medium:
      return 26
    case Size.Large:
      return 64
  }
}

const labelBackgroundHeight = (size: Size): number => {
  switch (size) {
    case Size.Small:
    case Size.Medium:
      return 11
    case Size.Large:
      return 24
  }
}

export default VehicleIcon
