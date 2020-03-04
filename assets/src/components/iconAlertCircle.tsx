import React from "react"

const IconAlertCircle = () => (
  <svg viewBox="0 0 48 48" className="c-icon-alert-circle">
    <IconAlertCircleSvgNode />
  </svg>
)

export const IconAlertCircleSvgNode = () => (
  <>
    <path
      d="m24 0a24 24 0 1 0 17 7 23.93 23.93 0 0 0 -17-7z"
      className="c-icon-alert-circle__outline"
    />
    <circle cx="24" cy="24" className="c-icon-alert-circle__circle" r="22.59" />
    <path
      d="m23.89 46.59a22.59 22.59 0 1 0 -22.48-22.7 22.59 22.59 0 0 0 22.48 22.7z"
      className="c-icon-alert-circle__circle-fill"
    />
    <g className="c-icon-alert-circle__exclamation-point">
      <path d="m20.39 4.42h7.22a1.81 1.81 0 0 1 1.49 2.11l-1.49 23.22a1.73 1.73 0 0 1 -1.49 1.78h-4.24a1.73 1.73 0 0 1 -1.49-1.78l-1.49-23.22c-.07-1.13.61-2.11 1.49-2.11" />
      <path d="m21.57 34.54h4.87a1.88 1.88 0 0 1 1.82 1.93v5.17a1.89 1.89 0 0 1 -1.82 1.94h-4.87a1.89 1.89 0 0 1 -1.83-1.94v-5.17a1.88 1.88 0 0 1 1.83-1.93" />
    </g>
  </>
)

export default IconAlertCircle
