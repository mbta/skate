import React from "react"
import { RttCall } from "./types"
import { RoutePill } from "../../routePill"
import { formattedTime } from "../../../util/dateTime"
import { joinClasses } from "../../../helpers/dom"

export interface RttDetailsPanelProps {
  call?: RttCall | null
  isLive?: boolean
  onMarkDone?: (call: RttCall) => void
}

const formatDateTimeValue = (val?: Date | string | null): string => {
  if (!val) return "N/A"
  const date = typeof val === "string" ? new Date(val) : val
  return formattedTime(date)
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

  const routeDisplay = (
    <div
      style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
    >
      <RoutePill routeName={call.routeName || call.routeId} />
      <span>
        {call.direction ? `${call.direction}` : ""}
        {call.variant ? ` • ${call.variant}` : ""}
      </span>
    </div>
  )

  const operatorDisplay =
    call.operatorBadge || call.operatorName
      ? `${call.operatorBadge ? `#${call.operatorBadge} ` : ""}${
          call.operatorName || ""
        }`
      : "N/A"

  return (
    <aside className={classes}>
      <div className="c-rtt-details-panel__header">
        <div className="c-rtt-details-panel__header-info">
          <h2 className="c-rtt-details-panel__title">
            {call.callType} — Vehicle #{call.vehicleId}
          </h2>
          {live && (
            <div className="c-rtt-details-panel__live-tag">
              <span className="c-rtt-details-panel__live-dot" />
              Live Call
            </div>
          )}
        </div>

        {live && onMarkDone && (
          <button
            type="button"
            className="c-rtt-details-panel__mark-done-btn"
            onClick={() => onMarkDone(call)}
          >
            Mark done
          </button>
        )}
      </div>

      <div className="c-rtt-details-panel__fields">
        <div className="c-rtt-details-panel__field">
          <span className="c-rtt-details-panel__label">Call Type</span>
          <span className="c-rtt-details-panel__value">{call.callType}</span>
        </div>

        <div className="c-rtt-details-panel__field">
          <span className="c-rtt-details-panel__label">Time Received</span>
          <span className="c-rtt-details-panel__value">
            {formatDateTimeValue(call.receivedAt)}
          </span>
        </div>

        <div className="c-rtt-details-panel__field">
          <span className="c-rtt-details-panel__label">Vehicle Number</span>
          <span className="c-rtt-details-panel__value">#{call.vehicleId}</span>
        </div>

        <div className="c-rtt-details-panel__field">
          <span className="c-rtt-details-panel__label">
            Route, Direction & Variant
          </span>
          <div className="c-rtt-details-panel__value">{routeDisplay}</div>
        </div>

        <div className="c-rtt-details-panel__field">
          <span className="c-rtt-details-panel__label">Current Location</span>
          <span className="c-rtt-details-panel__value">
            {call.currentLocation || "Unknown"}
          </span>
        </div>

        <div className="c-rtt-details-panel__field">
          <span className="c-rtt-details-panel__label">
            Operator Badge & Name
          </span>
          <span className="c-rtt-details-panel__value">{operatorDisplay}</span>
        </div>

        <div className="c-rtt-details-panel__field">
          <span className="c-rtt-details-panel__label">Run Number</span>
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
            <span className="c-rtt-details-panel__value">{call.talkGroup}</span>
          </div>
        )}

        {call.answeredAt && (
          <div className="c-rtt-details-panel__field">
            <span className="c-rtt-details-panel__label">
              Call Answered Time
            </span>
            <span className="c-rtt-details-panel__value">
              {formatDateTimeValue(call.answeredAt)}
              {call.respondedBy ? ` (by ${call.respondedBy})` : ""}
            </span>
          </div>
        )}

        {call.markedDoneAt && (
          <div className="c-rtt-details-panel__field">
            <span className="c-rtt-details-panel__label">
              Call Marked Done Time
            </span>
            <span className="c-rtt-details-panel__value">
              {formatDateTimeValue(call.markedDoneAt)}
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
