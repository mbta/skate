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
  const bannerText = `ACTIVE ${activeCall.callType.toUpperCase()} VEHICLE ${activeCall.vehicleId}`

  return (
    <div
      className="c-active-rtt-banner"
      role="region"
      aria-label="Active Call Banner"
    >
      <div className="c-active-rtt-banner__content">
        <span className="c-active-rtt-banner__dot" aria-hidden="true" />
        {onSelectActive ? (
          <button
            type="button"
            className="c-active-rtt-banner__text"
            onClick={() => onSelectActive(activeCall)}
          >
            {bannerText}
          </button>
        ) : (
          <span className="c-active-rtt-banner__text">{bannerText}</span>
        )}
      </div>

      <button
        type="button"
        className="c-active-rtt-banner__mark-done-btn"
        onClick={() => onMarkDone(activeCall)}
      >
        MARK DONE
      </button>
    </div>
  )
}
