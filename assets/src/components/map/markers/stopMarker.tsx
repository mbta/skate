import React, { useMemo, useState } from "react"

import { LeafletEventHandlerFnMap, PointTuple } from "leaflet"
import "leaflet.fullscreen"
import { MarkerProps } from "react-leaflet"

import { joinClasses } from "../../../helpers/dom"
import { DirectionId, Stop } from "../../../schedule"
import { MobileFriendlyTooltip } from "../../mapMarkers"
import StopCard from "../../stopCard"
import { ReactMarker } from "../utilities/reactMarker"

/**
 * Specific variants that the `StopIcon` can render
 */
export enum StopType {
  Small,
  Medium,
  Large,
}

/**
 * Produces the StopType assigned to the provided map Zoom-Level
 * @param zoomLevel The Map Zoom Level to use for figuring out the StopType
 */
export const stopTypeFromZoomLevel = (zoomLevel: number) => {
  if (zoomLevel <= 14) {
    return StopType.Small
  } else if (15 <= zoomLevel && zoomLevel <= 16) {
    return StopType.Medium
  } else if (17 <= zoomLevel) {
    return StopType.Large
  } else {
    throw new Error(
      "internal error: entered unreachable code: invalid zoom level"
    )
  }
}

export const stopIconSizeFromZoomLevel = (zoomLevel: number) =>
  stopIconSizeFromStopType(stopTypeFromZoomLevel(zoomLevel))

/**
 * Represents the box size of the icon at each `StopType`.
 *
 * For a `<circle>`, this means the size needs to include the `radius` AND
 * `stroke-width`, or specify `overflow-visible`. This will directly impact
 * the tap target on the leaflet map.
 */
export const stopIconSizeFromStopType = (stopType: StopType): PointTuple => {
  switch (stopType) {
    case StopType.Small:
      return [14, 14]
    case StopType.Medium:
      return [18, 18]
    case StopType.Large:
      return [20, 20]
  }
}

interface FocusCircleProps extends React.ComponentPropsWithoutRef<"circle"> {
  className?: string
}

const FocusCircle = ({ className, ...props }: FocusCircleProps) => {
  const focusCircleClasses = [
    "transform-origin-center",
    "stroke-transparent",
    "c-stop-icon-focus_stroke-eggplant-500",
  ]
  return (
    <circle
      {...props}
      className={joinClasses([className, ...focusCircleClasses])}
    ></circle>
  )
}

export const StopIcon = ({
  type,
  selected = false,
}: {
  type: StopType
  selected?: boolean
}) => {
  const commonSvgClasses = [
    "d-block",
    "overflow-visible",
    "transform-origin-center",
  ]
  const embeddedSvgClasses = joinClasses(commonSvgClasses)

  const circleClasses = [
    // Defaults
    "transform-origin-center",
    "fill-white",
    "stroke-gray-700",
    "stroke-width-1",

    // Interactions
    "c-stop-icon-selected_stroke-eggplant-700",
    "c-stop-icon-selected_fill-eggplant-200",

    "c-stop-icon-hover_stroke-width-2",
    "c-stop-icon-focus_stroke-width-2",
    "c-stop-icon-selected_stroke-width-2",
  ]
  const strokeWidthOffset = 3

  const busClasses = joinClasses([
    // Defaults
    "scale--2",
    "fill-gray-700",
    "stroke-width-0",
    "transform-origin-center",

    // Interactions
    "c-stop-icon-hover_fill-eggplant-700",
    "c-stop-icon-focus_fill-eggplant-700",
    "c-stop-icon-selected_fill-eggplant-700",
  ])

  return (
    <svg
      // Size to container
      width="100%"
      height="100%"
      className={joinClasses([
        ...commonSvgClasses,
        "c-stop-icon", // Interaction Group

        // Interactions
        "transition-2",
        "scale-2-hover",
        "scale-2-focus",
        "scale-2-selected",
      ])}
      data-selected={selected || null} // Remove attribute if `false`
    >
      {/* `width` and `height` is not specified on child SVG's so they size to
       * the parent SVG. This makes `StopIconSizeFromStopType` the source of
       * truth for the size on the map.
       * Specifying the `viewbox` ensures that the aspect ratio is correct,
       * and Leaflet specifies the container size on the map via `DivIconOptions.iconSize`,
       * which the child SVG's fill because `width` and `height` are `auto` by
       * default, and the parent SVG is explicitly setting `width` and `height`
       * to `100%`
       */}
      {/*
        It does suck that we're completely replacing the icon when the type
        changes, because that breaks any animations or states that were applied
        to the previous element, but in trying to stay as close to the provided
        art assets as possible, this was easiest.
       */}
      {type === StopType.Small && (
        <svg className={embeddedSvgClasses} viewBox="0 0 14 14" fill="none">
          <FocusCircle cx="7" cy="7" r={5 + strokeWidthOffset} />
          <circle
            className={joinClasses([
              ...circleClasses,
              "c-stop-icon-hover_stroke-eggplant-700",
            ])}
            cx="7"
            cy="7"
            r="5"
            fill="white"
            stroke="#3C3F4C"
            strokeWidth="1"
          />
        </svg>
      )}
      {type === StopType.Medium && (
        <svg className={embeddedSvgClasses} viewBox="0 0 18 18" fill="none">
          <FocusCircle cx="9" cy="9" r={7 + strokeWidthOffset} />
          <circle
            className={joinClasses(circleClasses)}
            cx="9"
            cy="9"
            r="7"
            fill="white"
            stroke="#3C3F4C"
            strokeWidth="1"
          />
          <path
            className={busClasses}
            fillRule="evenodd"
            clipRule="evenodd"
            d="m 13.520835,8.4890482 -0.4396,-3.27586 c -0.1146,-0.59081 -0.5071,-0.82606 -1.0886,-1.06743 -0.9672,-0.32414 -1.97687,-0.49732 -2.99643,-0.51725 -1.01653,0.01993 -2.02394,0.19387 -2.98808,0.51725 -0.57545,0.24137 -0.97477,0.47662 -1.09624,1.06743 l -0.43272,3.27586 v 4.5248998 h 0.80775 v 0.7716 c 0.00532,0.2039 0.11919,0.3893 0.29759,0.4836 0.041,0.0199 0.08123,0.0406 0.11464,0.0536 0.03112,0.0115 0.06301,0.0207 0.09489,0.0268 0.05163,0.0138 0.10325,0.0207 0.15563,0.0207 h 0.23003 c 0.34314,0.0215 0.6415,-0.2383 0.66958,-0.5847 v -0.7716 h 4.36676 v 0.7716 c 0.0053,0.2039 0.1184,0.3893 0.2968,0.4836 0.041,0.0199 0.082,0.0406 0.1154,0.0536 0.0311,0.0115 0.0622,0.0207 0.0949,0.0268 0.0501,0.0138 0.1032,0.0207 0.1556,0.0207 h 0.23 c 0.3432,0.0215 0.64,-0.2383 0.6689,-0.5847 v -0.7716 h 0.7432 z m -6.6263,-4.06127 h 4.2528 c 0.2035,0 0.3682,0.16399 0.372,0.36935 -0.0038,0.2046 -0.1685,0.36935 -0.372,0.36935 h -4.2528 c -0.20346,0 -0.36895,-0.16475 -0.37275,-0.36935 0.0038,-0.20536 0.16929,-0.36935 0.37275,-0.36935 z m -1.06133,3.99082 0.30139,-2.23985 c 0.02809,-0.15478 0.1655,-0.26436 0.32188,-0.2567 h 5.12816 c 0.1556,-0.00613 0.293,0.10268 0.3227,0.2567 l 0.3439,2.23985 v 0.10038 c -0.0046,0.17625 -0.1481,0.31495 -0.3227,0.31265 h -5.78483 c -0.17309,-0.0069 -0.3105,-0.15019 -0.3105,-0.32567 -0.00607,-0.02836 -0.00607,-0.05824 0,-0.08736 z m 0.42882,3.5202498 c -0.5132,0.0238 -0.95503,-0.364 -1.00438,-0.8797 0,-0.2575 0.10097,-0.5057 0.28165,-0.68734 0.18068,-0.18238 0.4259,-0.28506 0.68097,-0.28506 0.5299,-0.03985 0.99375,0.35556 1.04614,0.8889 -0.00608,0.2628 -0.1154,0.5119 -0.30443,0.6919 -0.18827,0.1817 -0.44032,0.279 -0.69995,0.2713 z m 5.43181,0 c -0.514,0.0238 -0.9551,-0.364 -1.0044,-0.8797 0,-0.2575 0.101,-0.5057 0.2824,-0.68734 0.1799,-0.18238 0.4244,-0.28506 0.6802,-0.28506 0.5299,-0.03985 0.9945,0.35556 1.0454,0.8889 -0.0053,0.2628 -0.1146,0.5119 -0.3029,0.6919 -0.1883,0.1817 -0.4411,0.279 -0.7007,0.2713 z"
            fill="#3c3f4c"
          />
        </svg>
      )}
      {type === StopType.Large && (
        <svg className={embeddedSvgClasses} viewBox="0 0 20 20" fill="none">
          <FocusCircle cx="10" cy="10" r={8 + strokeWidthOffset} />
          <circle
            className={joinClasses(circleClasses)}
            cx="10"
            cy="10"
            r="8"
            fill="white"
            stroke="#3C3F4C"
            strokeWidth="1"
          />
          <path
            className={busClasses}
            fillRule="evenodd"
            clipRule="evenodd"
            d="m 15,9.4348766 -0.4861,-3.62308 c -0.1268,-0.65342 -0.5609,-0.9136 -1.2041,-1.18057 -1.0697,-0.35849 -2.1864,-0.55002 -3.314,-0.57206 -1.12426,0.02204 -2.23845,0.21442 -3.30478,0.57206 -0.63644,0.26697 -1.07809,0.52715 -1.21243,1.18057 L 5,9.4348766 v 5.0044904 h 0.89337 v 0.8534 c 0.00587,0.2255 0.13182,0.4306 0.32913,0.5348 0.04534,0.022 0.08984,0.0449 0.12679,0.0593 0.03442,0.0128 0.06969,0.0229 0.10495,0.0297 0.0571,0.0153 0.11419,0.0229 0.17212,0.0229 h 0.25441 c 0.37952,0.0237 0.70949,-0.2636 0.74056,-0.6467 v -0.8534 h 4.82957 v 0.8534 c 0.0059,0.2255 0.131,0.4306 0.3283,0.5348 0.0453,0.022 0.0907,0.0449 0.1276,0.0593 0.0344,0.0128 0.0689,0.0229 0.105,0.0297 0.0554,0.0153 0.1141,0.0229 0.1721,0.0229 h 0.2544 c 0.3795,0.0237 0.7078,-0.2636 0.7397,-0.6467 v -0.8534 H 15 Z m -7.32822,-4.49177 h 4.70362 c 0.225,0 0.4072,0.18136 0.4114,0.40849 -0.0042,0.22629 -0.1864,0.4085 -0.4114,0.4085 H 7.67178 c -0.22502,0 -0.40806,-0.18221 -0.41226,-0.4085 0.0042,-0.22713 0.18724,-0.40849 0.41226,-0.40849 z m -1.17382,4.4138 0.33333,-2.47725 c 0.03107,-0.17119 0.18304,-0.29238 0.356,-0.28391 H 12.859 c 0.1721,-0.00678 0.3241,0.11357 0.3568,0.28391 l 0.3804,2.47725 v 0.11103 c -0.005,0.19492 -0.1637,0.34832 -0.3568,0.34578 H 6.84137 c -0.19144,-0.00763 -0.34341,-0.16611 -0.34341,-0.36019 -0.00672,-0.03136 -0.00672,-0.06441 0,-0.09662 z m 0.47347,3.8934604 c -0.56759,0.0263 -1.05626,-0.4026 -1.11083,-0.9729 0,-0.2848 0.11167,-0.5594 0.3115,-0.7602 0.19983,-0.2017 0.47103,-0.3153 0.75315,-0.3153 0.58606,-0.0441 1.09907,0.3932 1.15701,0.9831 -0.00672,0.2907 -0.12763,0.5661 -0.33669,0.7653 -0.20823,0.2009 -0.48699,0.3085 -0.77414,0.3 z m 6.00827,0 c -0.5684,0.0263 -1.0562,-0.4026 -1.1108,-0.9729 0,-0.2848 0.1117,-0.5594 0.3123,-0.7602 0.199,-0.2017 0.4694,-0.3153 0.7523,-0.3153 0.5861,-0.0441 1.1,0.3932 1.1562,0.9831 -0.0059,0.2907 -0.1268,0.5661 -0.335,0.7653 -0.2082,0.2009 -0.4878,0.3085 -0.775,0.3 z"
            fill="#3c3f4c"
            id="path1465"
          />
        </svg>
      )}
    </svg>
  )
}

interface StopMarkerProps extends Partial<MarkerProps> {
  stop: Stop
  selected?: boolean
  zoomLevel?: number
}
export const StopMarker = ({
  stop,
  selected = false,
  zoomLevel = 0,
  ...props
}: StopMarkerProps) => {
  const stopType = stopTypeFromZoomLevel(zoomLevel)
  const divIconSettings = useMemo(
    () => ({
      iconSize: stopIconSizeFromStopType(stopType),
      className: "c-vehicle-map__stop", // Prevent default leaflet class & outline
    }),
    [stopType]
  )

  return (
    <ReactMarker
      {...(props as MarkerProps)}
      position={[stop.lat, stop.lon]}
      divIconSettings={divIconSettings}
      icon={<StopIcon type={stopType} selected={selected} />}
    />
  )
}

export type StopCardProps = { direction?: DirectionId }
export const StopMarkerWithStopCard = ({
  direction,
  ...props
}: StopMarkerProps & StopCardProps) => {
  const [isSelected, setIsSelected] = useState(props.selected || false)

  const popupHandlers: LeafletEventHandlerFnMap = {
    popupopen: (e) => {
      window.FS?.event("Bus stop card opened")
      setIsSelected(true)
      props.eventHandlers?.popupopen?.(e)
    },
    popupclose: (e) => {
      setIsSelected(false)
      props.eventHandlers?.popupclose?.(e)
    },
  }

  return (
    <StopMarker
      {...props}
      // Override `eventHandlers` with our new `popupHandlers`
      eventHandlers={{ ...props.eventHandlers, ...popupHandlers }}
      selected={isSelected}
    >
      <StopCard.WithSafeArea stop={props.stop} direction={direction} />
    </StopMarker>
  )
}

export const StopMarkerWithToolTip = (props: StopMarkerProps) => {
  const [, size_y] = stopIconSizeFromZoomLevel(props.zoomLevel || 0)
  return (
    <StopMarker {...props}>
      <MobileFriendlyTooltip
        className={"c-vehicle-map__stop-tooltip"}
        markerRadius={size_y / 2}
      >
        {props.stop.name}
      </MobileFriendlyTooltip>
    </StopMarker>
  )
}

export type InteractiveStopMarkerProps = {
  includeStopCard?: boolean
}
export const StopMarkerWithInfo = ({
  includeStopCard = false,
  ...props
}: StopMarkerProps & StopCardProps & InteractiveStopMarkerProps) =>
  includeStopCard ? (
    <StopMarkerWithStopCard {...props} />
  ) : (
    <StopMarkerWithToolTip {...props} />
  )
