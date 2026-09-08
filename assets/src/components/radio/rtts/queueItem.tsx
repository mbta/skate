import React from "react"
import { RttCall, RttTab } from "./types"
import { RoutePill } from "../../routePill"
import { formattedTime } from "../../../util/dateTime"
import { joinClasses } from "../../../helpers/dom"

export interface RttQueueItemProps {
  call: RttCall
  isSelected?: boolean
  tab?: RttTab
  currentDispatcherName?: string
  onSelect?: (call: RttCall) => void
  onRespond?: (call: RttCall) => void
}

export const RttQueueItem = ({
  call,
  isSelected = false,
  tab = "incoming",
  currentDispatcherName = "Current Dispatcher",
  onSelect,
  onRespond,
}: RttQueueItemProps): JSX.Element => {
  const isEmergency = call.callType === "Emergency"
  const isPrtt = call.callType === "PRTT"
  const isActive = call.status === "active"

  const isRespondedByCurrentUser =
    isActive &&
    (call.respondedBy === currentDispatcherName ||
      call.respondedBy === "YOU" ||
      call.respondedBy === "You" ||
      !call.respondedBy)

  const responderDisplayName = isRespondedByCurrentUser
    ? "YOU"
    : call.respondedBy || "ACTIVE"

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
    isRespondedByCurrentUser ? "c-rtt-queue-item--live" : "",
    tab === "past" ? "c-rtt-queue-item--past" : "",
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
      <div
        className="c-rtt-queue-item__columns"
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
        <div className="c-rtt-queue-item__col c-rtt-queue-item__col--type">
          <span className={joinClasses(["c-rtt-queue-item__type", typeClass])}>
            {call.callType}
          </span>
        </div>

        <div className="c-rtt-queue-item__col c-rtt-queue-item__col--time">
          {timeDisplay}
        </div>

        <div className="c-rtt-queue-item__col c-rtt-queue-item__col--garage">
          {call.garage || call.talkGroup}
        </div>

        <div className="c-rtt-queue-item__col c-rtt-queue-item__col--route">
          <RoutePill routeName={call.routeName || call.routeId} />
        </div>

        <div className="c-rtt-queue-item__col c-rtt-queue-item__col--vehicle">
          {call.vehicleId}
        </div>
      </div>

      {tab === "incoming" && (
        <div className="c-rtt-queue-item__action">
          {isActive ? (
            <div
              className="c-rtt-queue-item__status-cell"
              title={`Responded by ${call.respondedBy || "Dispatcher"}`}
            >
              <span className="c-rtt-queue-item__status-dot" />
              <span className="c-rtt-queue-item__status-name">
                {responderDisplayName}
              </span>
            </div>
          ) : (
            <button
              type="button"
              className="c-rtt-queue-item__respond-btn"
              onClick={handleRespondClick}
            >
              RESPOND
            </button>
          )}
        </div>
      )}
    </div>
  )
}
