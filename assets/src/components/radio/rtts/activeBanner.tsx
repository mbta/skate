import React from "react"
import { RttCall } from "./types"

export interface ActiveRttBannerProps {
  activeCall: RttCall
  onMarkDone: (call: RttCall) => void
  onSelectActive?: (call: RttCall) => void
}

export const ActiveRttBanner = ({
  activeCall,
  onMarkDone,
  onSelectActive,
}: ActiveRttBannerProps): JSX.Element => {
  return (
    <div
      className="c-active-rtt-banner"
      role="region"
      aria-label="Active Call Banner"
    >
      <div
        className="c-active-rtt-banner__content"
        style={{ cursor: onSelectActive ? "pointer" : "default" }}
        onClick={() => onSelectActive?.(activeCall)}
      >
        <span className="c-active-rtt-banner__text">
          Active {activeCall.callType} vehicle #{activeCall.vehicleId}
        </span>
      </div>

      <button
        type="button"
        className="c-active-rtt-banner__mark-done-btn"
        onClick={() => onMarkDone(activeCall)}
      >
        Mark done
      </button>
    </div>
  )
}
