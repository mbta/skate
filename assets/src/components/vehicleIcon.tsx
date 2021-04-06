import React, { ReactElement, useContext } from "react"
import Tippy from "@tippyjs/react"
import "tippy.js/dist/tippy.css"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { className } from "../helpers/dom"
import { DrawnStatus, statusClasses } from "../models/vehicleStatus"
import { AlertIconStyle, IconAlertCircleSvgNode } from "./iconAlertCircle"
import { runIdToLabel } from "../helpers/vehicleLabel"
import { isGhost } from "../models/vehicle"
import { VehicleOrGhost } from "../realtime.d"
import { scheduleAdherenceLabelString } from "./propertiesPanel/header"

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
  alertIconStyle?: AlertIconStyle
}

export interface TooltipProps {
  children: ReactElement<HTMLElement>
  vehicleOrGhost: VehicleOrGhost
}

/*
Size of the triangle for calculation of the viewbox and positioning the label
Sizes are before scaling, relative to the center of the triangle
*/
const X_CENTER_TO_SIDE = 22
const Y_CENTER_TO_POINT = 20
const Y_CENTER_TO_BASE = 20
const ALERT_ICON_RADIUS = 27

export const VehicleIcon = (props: Props): ReactElement<HTMLElement> => {
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

export const VehicleTooltip = ({
  vehicleOrGhost,
  children,
}: TooltipProps): ReactElement<HTMLElement> => {
  return (
    <Tippy
      delay={[250, 0]}
      /* istanbul ignore next */
      onShown={() => {
        /* istanbul ignore next */
        if (window.FS) {
          /* istanbul ignore next */
          window.FS.event("Vehicle tooltip seen")
        }
      }}
      content={
        <>
          <b>Block:</b> {vehicleOrGhost.blockId}
          <br />
          <b>Run:</b> {runIdToLabel(vehicleOrGhost.runId)}
          <br />
          <b>Vehicle:</b>{" "}
          {isGhost(vehicleOrGhost) ? "N/A" : vehicleOrGhost.label}
          <br />
          <b>Variant:</b> {vehicleOrGhost.viaVariant}
          <br />
          <b>Adherence:</b>{" "}
          {isGhost(vehicleOrGhost) || vehicleOrGhost.isOffCourse
            ? "N/A"
            : scheduleAdherenceLabelString(vehicleOrGhost)}
          <br />
          <b>Operator:</b>{" "}
          {isGhost(vehicleOrGhost)
            ? "N/A"
            : `${vehicleOrGhost.operatorName} #${vehicleOrGhost.operatorId}`}
        </>
      }
    >
      {children}
    </Tippy>
  )
}

export const viewBox = ({
  size,
  orientation,
  label,
  status,
  alertIconStyle,
}: Props): { left: number; top: number; width: number; height: number } => {
  // shrink the viewbox to fit around the triangle and label
  const scale = scaleForSize(size)
  const labelBgWidth = label ? labelBackgroundWidth(size, label) : 0
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
  // expand to fit the label
  left = Math.min(left, -labelBgWidth / 2)
  right = Math.max(right, labelBgWidth / 2)
  // expand to fit the alert icon
  if (alertIconStyle !== undefined) {
    const [alertIconX, alertIconY] = alertIconXY(size, orientation, status)
    const alertIconRadius = ALERT_ICON_RADIUS * alertCircleIconScale(size)
    left = Math.min(left, alertIconX - alertIconRadius)
    right = Math.max(right, alertIconX + alertIconRadius)
    top = Math.min(top, alertIconY - alertIconRadius)
    bottom = Math.max(bottom, alertIconY + alertIconRadius)
  }
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
  alertIconStyle,
}: Props): ReactElement<SVGElement> => {
  const [{ userSettings }] = useContext(StateDispatchContext)

  status = status || "plain"
  variant = variant && variant !== "_" ? variant : undefined
  // ghosts can't be drawn sideways
  if (
    status === "ghost" &&
    (orientation === Orientation.Left || orientation === Orientation.Right)
  ) {
    orientation = Orientation.Up
  }
  const classes: string[] = [
    "m-vehicle-icon",
    `m-vehicle-icon${sizeClassSuffix(size)}`,
    alertIconStyle === AlertIconStyle.Highlighted
      ? "m-vehicle-icon--highlighted"
      : "",
  ].concat(statusClasses(status, userSettings.vehicleAdherenceColors))
  return (
    <g className={className(classes)}>
      {label ? (
        <Label size={size} orientation={orientation} label={label} />
      ) : null}
      {status === "ghost" ? (
        <Ghost size={size} variant={variant} />
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

      {alertIconStyle ? (
        <AlertCircleIcon
          size={size}
          orientation={orientation}
          status={status}
          alertIconStyle={alertIconStyle}
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

export const Label = ({
  size,
  orientation,
  label,
}: {
  size: Size
  orientation: Orientation
  label: string
}) => {
  const scale = scaleForSize(size)
  const labelBgWidth = labelBackgroundWidth(size, label)
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

  const labelClassWithModifier =
    label.length > 4
      ? "m-vehicle-icon__label--extended"
      : "m-vehicle-icon__label--normal"
  const labelClass = `m-vehicle-icon__label ${labelClassWithModifier}`

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
        className={labelClass}
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

const alertIconXY = (
  size: Size,
  orientation: Orientation,
  status?: DrawnStatus
): [number, number] => {
  const scale = scaleForSize(size)
  if (status === "ghost") {
    const y = -10
    const x = orientation === Orientation.Down ? -15 : 15
    return [x * scale, y * scale]
  } else {
    let [x, y] = size === Size.Small ? [13, -5] : [14, 3]
    ;[x, y] = rotate(x, y, orientation)
    return [x * scale, y * scale]
  }
}

const rotate = (
  upX: number,
  upY: number,
  orientation: Orientation
): [number, number] => {
  switch (orientation) {
    case Orientation.Up:
      return [upX, upY]
    case Orientation.Down:
      return [-upX, -upY]
    case Orientation.Left:
      return [upY, -upX]
    case Orientation.Right:
      return [-upY, upX]
  }
}

const AlertCircleIcon = ({
  size,
  orientation,
  status,
  alertIconStyle,
}: {
  size: Size
  orientation: Orientation
  status: DrawnStatus
  alertIconStyle: AlertIconStyle
}) => {
  const [x, y] = alertIconXY(size, orientation, status)
  const scale = alertCircleIconScale(size)
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale}) translate(-24, -24)`}>
      <IconAlertCircleSvgNode style={alertIconStyle} />
    </g>
  )
}

const alertCircleIconScale = (size: Size): number => {
  switch (size) {
    case Size.Small:
      return 0.16
    case Size.Medium:
      return 0.2
    case Size.Large:
      return 0.3
  }
}

export const sizeClassSuffix = (size: Size): string => {
  switch (size) {
    case Size.Small:
      return "--small"
    case Size.Medium:
      return "--medium"
    case Size.Large:
      return "--large"
  }
}

export const scaleForSize = (size: Size): number => {
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

const labelBackgroundWidth = (size: Size, label: string): number => {
  switch (size) {
    case Size.Small:
    case Size.Medium:
      return label.length <= 4 ? 26 : 40
    case Size.Large:
      return label.length <= 4 ? 64 : 72
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
