import { LeafletMouseEvent } from "leaflet"
import React, { useRef } from "react"
import { useMapEvents } from "react-leaflet"

/**
 * Cutout Overlay Props
 */
type CutoutOverlayProps = {
  /**
   * Cutout Circle Reference for moving the cutout
   */
  circleTargetRef?: React.Ref<SVGCircleElement>
  /**
   * Containing box of the {@link CutoutOverlayProps.circleTargetRef}
   *
   * Used when calculating circle position from external coordinate systems
   * such as mouse coordinates.
   */
  containerTargetRef?: React.Ref<SVGSVGElement>
}

/**
 * Low Level cutout overlay, use map specific adapters
 */
export const CutoutOverlay = ({
  circleTargetRef: circleTarget,
  containerTargetRef: containerTarget,
}: CutoutOverlayProps) => {
  return (
    <svg ref={containerTarget} className={"c-overlay-cutout"}>
      <mask id="mask">
        <rect className="c-overlay-cutout__mask-rect" />
        <circle
          className="c-overlay-cutout__mask-circle"
          ref={circleTarget}
        ></circle>
      </mask>
      <rect
        // Set inline, so that rect updates when parent sizes update
        width="100%"
        height="100%"
        className="c-overlay-cutout__rect"
        mask="url(#mask)"
      />
    </svg>
  )
}

/** {@see {@link CutoutOverlay.FollowMapMouseMove }} */
const CutoutOverlayFollowMouseMove = () => {
  const circleTarget = useRef<SVGCircleElement | null>(null)
  const hoverTarget = useRef<SVGSVGElement | null>(null)

  useMapEvents({
    mousemove: (e: LeafletMouseEvent): void => {
      if (circleTarget.current && hoverTarget.current) {
        const { clientX: cursorScreenX, clientY: cursorScreenY } =
          e.originalEvent
        const { x: containerScreenX, y: containerScreenY } =
          hoverTarget.current.getBoundingClientRect()

        const containerOffsetX = cursorScreenX - containerScreenX
        const containerOffsetY = cursorScreenY - containerScreenY

        const maskPosition = `${containerOffsetX}px ${containerOffsetY}px`

        circleTarget.current.style.translate = maskPosition
      }
    },
  })

  return (
    <CutoutOverlay
      containerTargetRef={hoverTarget}
      circleTargetRef={circleTarget}
    />
  )
}

/**
 * A {@link CutoutOverlay} which follows mouse movements on a
 * `react-leaflet.MapContainer`
 */
CutoutOverlay.FollowMapMouseMove = CutoutOverlayFollowMouseMove
