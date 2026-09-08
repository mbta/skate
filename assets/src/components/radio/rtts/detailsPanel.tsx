import React from "react"
import { RttCall } from "./types"
import { formatTimeWithSeconds } from "../../../util/dateTime"
import { joinClasses } from "../../../helpers/dom"

export interface RttDetailsPanelProps {
  call?: RttCall | null
  isLive?: boolean
  onMarkDone?: (call: RttCall) => void
}

export const RttDetailsPanel = ({
  call,
  isLive = false,
  onMarkDone,
}: RttDetailsPanelProps): JSX.Element => {
  if (!call) {
    return (
      <aside className="c-rtt-details-panel">
        <div className="c-rtt-details-panel__empty">
          <p>Select a call from the queue to view details</p>
        </div>
      </aside>
    )
  }

  const live = isLive || call.status === "active"

  const classes = joinClasses([
    "c-rtt-details-panel",
    live ? "c-rtt-details-panel--live" : "",
  ])

  const operatorDisplay =
    call.operatorBadge || call.operatorName
      ? `${call.operatorBadge ? `#${call.operatorBadge} ` : ""}${
          call.operatorName || ""
        }`
      : "N/A"

  const headsignDisplay =
    call.variant ||
    `${call.routeName || call.routeId}${
      call.direction ? ` ${call.direction}` : ""
    }`

  return (
    <aside className={classes}>
      <div className="c-rtt-details-panel__header">
        <div className="c-rtt-details-panel__header-info">
          <h2 className="c-rtt-details-panel__title">
            <span className="c-rtt-details-panel__call-type">
              {call.callType}
            </span>
            <span className="c-rtt-details-panel__call-time">
              {formatTimeWithSeconds(call.receivedAt)}
            </span>
          </h2>
          {live && (
            <div className="c-rtt-details-panel__live-tag">
              <span className="c-rtt-details-panel__live-dot" />
              Live Call
            </div>
          )}
        </div>

        <div className="c-rtt-details-panel__header-actions">
          <div className="c-rtt-details-panel__timestamps">
            {call.answeredAt && (
              <div className="c-rtt-details-panel__timestamp-row">
                <span className="c-rtt-details-panel__timestamp-label">
                  ANSWERED
                </span>
                <span className="c-rtt-details-panel__timestamp-val">
                  {formatTimeWithSeconds(call.answeredAt)}
                </span>
              </div>
            )}
            {call.markedDoneAt && (
              <div className="c-rtt-details-panel__timestamp-row">
                <span className="c-rtt-details-panel__timestamp-label">
                  MARKED DONE
                </span>
                <span className="c-rtt-details-panel__timestamp-val">
                  {formatTimeWithSeconds(call.markedDoneAt)}
                </span>
              </div>
            )}
          </div>

          {live && onMarkDone && (
            <button
              type="button"
              className="c-rtt-details-panel__mark-done-btn"
              onClick={() => onMarkDone(call)}
            >
              MARK DONE
            </button>
          )}
        </div>
      </div>

      <div className="c-rtt-details-panel__body">
        <div className="c-rtt-details-panel__hero">
          <div className="c-rtt-details-panel__vehicle-badge">
            <svg
              className="c-rtt-details-panel__vehicle-triangle"
              viewBox="0 0 24 24"
              width="28"
              height="28"
              aria-hidden="true"
            >
              <path d="M12 2L2 22h20L12 2z" />
            </svg>
            <span className="c-rtt-details-panel__vehicle-id">
              {call.vehicleId}
            </span>
          </div>

          <div className="c-rtt-details-panel__hero-route">
            <div className="c-rtt-details-panel__direction">
              {call.direction?.toUpperCase() || "OUTBOUND"}
            </div>
            <div className="c-rtt-details-panel__headsign">
              {headsignDisplay.toUpperCase()}
            </div>
            {call.adherence && (
              <div className="c-rtt-details-panel__adherence">
                {call.adherence.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="c-rtt-details-panel__fields">
          <div className="c-rtt-details-panel__field">
            <span className="c-rtt-details-panel__label">Current Location</span>
            <span className="c-rtt-details-panel__value">
              {call.currentLocation || "Unknown"}
            </span>
          </div>

          <div className="c-rtt-details-panel__field">
            <span className="c-rtt-details-panel__label">Operator</span>
            <span className="c-rtt-details-panel__value">
              {operatorDisplay}
            </span>
          </div>

          <div className="c-rtt-details-panel__field">
            <span className="c-rtt-details-panel__label">Run</span>
            <span className="c-rtt-details-panel__value">
              {call.runNumber || "N/A"}
            </span>
          </div>

          {call.garage && (
            <div className="c-rtt-details-panel__field">
              <span className="c-rtt-details-panel__label">Garage</span>
              <span className="c-rtt-details-panel__value">{call.garage}</span>
            </div>
          )}

          {call.talkGroup && (
            <div className="c-rtt-details-panel__field">
              <span className="c-rtt-details-panel__label">Talk Group</span>
              <span className="c-rtt-details-panel__value">
                {call.talkGroup}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
