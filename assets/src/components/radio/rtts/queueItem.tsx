import React from "react"
import { RttCall, RttTab } from "./types"
import { RoutePill } from "../../routePill"
import { formattedTime } from "../../../util/dateTime"
import { joinClasses } from "../../../helpers/dom"

export interface RttQueueItemProps {
  call: RttCall
  isSelected?: boolean
  tab?: RttTab
  onSelect?: (call: RttCall) => void
  onRespond?: (call: RttCall) => void
}

export const RttQueueItem = ({
  call,
  isSelected = false,
  tab = "incoming",
  onSelect,
  onRespond,
}: RttQueueItemProps): JSX.Element => {
  const isEmergency = call.callType === "Emergency"
  const isPrtt = call.callType === "PRTT"
  const isActive = call.status === "active"

  const typeClass = isEmergency
    ? "c-rtt-queue-item__type--emergency"
    : isPrtt
    ? "c-rtt-queue-item__type--prtt"
    : "c-rtt-queue-item__type--rtt"

  const priorityBorderClass = isEmergency
    ? "c-rtt-queue-item--emergency"
    : isPrtt
    ? "c-rtt-queue-item--prtt"
    : "c-rtt-queue-item--rtt"

  const classes = joinClasses([
    "c-rtt-queue-item",
    priorityBorderClass,
    isSelected ? "c-rtt-queue-item--selected" : "",
    isActive ? "c-rtt-queue-item--live" : "",
  ])

  const handleRowClick = () => {
    onSelect?.(call)
  }

  const handleRespondClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRespond?.(call)
  }

  const timeDisplay =
    typeof call.receivedAt === "string"
      ? formattedTime(new Date(call.receivedAt))
      : formattedTime(call.receivedAt)

  return (
    <div className={classes} aria-selected={isSelected}>
      {tab === "incoming" && (
        <div className="c-rtt-queue-item__action">
          {call.status === "active" && call.respondedBy ? (
            <span
              className="c-rtt-queue-item__status-pill"
              title={`Responded by ${call.respondedBy}`}
            >
              <span className="c-rtt-queue-item__status-dot" />
              {call.respondedBy}
            </span>
          ) : (
            <button
              type="button"
              className="c-rtt-queue-item__respond-btn"
              onClick={handleRespondClick}
            >
              Respond
            </button>
          )}
        </div>
      )}

      <div
        className="c-rtt-queue-item__content"
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleRowClick()
          }
        }}
      >
        <span className={joinClasses(["c-rtt-queue-item__type", typeClass])}>
          {call.callType}
        </span>
        <span className="c-rtt-queue-item__talkgroup">{call.talkGroup}</span>
        <div className="c-rtt-queue-item__route">
          <RoutePill routeName={call.routeName || call.routeId} />
        </div>
        <span className="c-rtt-queue-item__vehicle">#{call.vehicleId}</span>
      </div>

      <div className="c-rtt-queue-item__time">{timeDisplay}</div>
    </div>
  )
}
