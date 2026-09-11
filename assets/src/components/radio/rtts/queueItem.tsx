import React from "react"
import { RttCall, RttCallType, RttTab } from "./types"
import { RoutePill } from "../../routePill"
import { formattedTime } from "../../../util/dateTime"
import { joinClasses } from "../../../helpers/dom"

const CALL_TYPE_MODIFIERS: Record<RttCallType, string> = {
  Emergency: "emergency",
  PRTT: "prtt",
  RTT: "rtt",
}

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

  const modifier = CALL_TYPE_MODIFIERS[call.callType] ?? "rtt"
  const typeClass = `c-rtt-queue-item__type--${modifier}`
  const priorityBorderClass = `c-rtt-queue-item--${modifier}`

  const classes = joinClasses([
    "c-rtt-queue-item",
    priorityBorderClass,
    isSelected && "c-rtt-queue-item--selected",
    isRespondedByCurrentUser && "c-rtt-queue-item--live",
    tab === "past" && "c-rtt-queue-item--past",
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
    <div className={classes} role="listitem">
      <div
        className="c-rtt-queue-item__columns"
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`Select ${call.callType} call for vehicle ${call.vehicleId}`}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleRowClick()
          }
        }}
      >
        <div className="c-rtt-queue-item__col c-rtt-queue-item__col--type">
          <span className={`c-rtt-queue-item__type ${typeClass}`}>
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
              <span
                className="c-rtt-queue-item__status-dot"
                aria-hidden="true"
              />
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
