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
    <svg ref={containerTarget} className={"c-cutout-overlay"}>
      <mask id="mask">
        <rect className="c-cutout-overlay__mask-rect" />
        <circle
          className="c-cutout-overlay__mask-circle"
          ref={circleTarget}
        ></circle>
      </mask>
      <rect
        // When the parent container (e.g., the map container) changes sizes,
        // the parent SVG resizes, but that does not propagate down to this rect
        // unless `width` and `height` are set inline.
        width="100%"
        height="100%"
        className="c-cutout-overlay__rect"
        mask="url(#mask)"
      />
    </svg>
  )
}

/** {@see {@link CutoutOverlay.FollowMapMouseMove }} */
const CutoutOverlayFollowMapMouseMove = () => {
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
    <>
      {/* This hover target is required so that the radius of the cutout is 0
          when hovering over controls. This target _must_ come before the
          overlay so that the CSS sibling selector works. */}
      <div className="c-cutout-overlay-hover-target" />
      <CutoutOverlay
        containerTargetRef={hoverTarget}
        circleTargetRef={circleTarget}
      />
    </>
  )
}

/**
 * A {@link CutoutOverlay} which follows mouse movements on a
 * `react-leaflet.MapContainer`
 */
CutoutOverlay.FollowMapMouseMove = CutoutOverlayFollowMapMouseMove
