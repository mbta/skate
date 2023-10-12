import { fullStoryEvent } from "../../../helpers/fullStory"
import { ControlOptions } from "leaflet"
import React from "react"

import { CustomControl } from "./customControl"

export interface RecenterButtonProps {
  active?: boolean
  onActivate?: () => void
}
export const RecenterButton = ({
  active,
  onActivate: onActivateProp,
}: RecenterButtonProps) => {
  const onActivate = () => {
    fullStoryEvent("Recenter control clicked", {})
    onActivateProp?.()
  }
  return (
    //eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a
      className="c-recenter-control"
      title="Recenter Map"
      role="button"
      aria-label="Recenter Map"
      onKeyDown={(e) => e.key === "Enter" && onActivate()}
      tabIndex={-1}
      onClick={onActivate}
      data-is-active={active}
    >
      <svg
        height="26"
        width="26"
        viewBox="-5 -5 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="m10 2.7-6.21 16.94a2.33 2.33 0 0 0 1.38 3 2.36 2.36 0 0 0 1.93-.14l4.9-2.67 4.89 2.71a2.34 2.34 0 0 0 3.34-2.8l-5.81-17a2.34 2.34 0 0 0 -4.4 0z"
          transform="rotate(60, 12, 12)"
        />
      </svg>
    </a>
  )
}

export const RecenterControl = ({
  active = false,
  onActivate: onClick,
  ...props
}: RecenterButtonProps & ControlOptions) => {
  return (
    <CustomControl position="topright" {...props} className="leaflet-bar">
      <RecenterButton {...{ active, onActivate: onClick }} />
    </CustomControl>
  )
}
