import React from "react"
import { RttCall } from "./types"
import { formattedTimeWithSeconds } from "../../../util/dateTime"
import { joinClasses } from "../../../helpers/dom"

export interface RttDetailsPanelProps {
  call?: RttCall | null
  isLive?: boolean
  onMarkDone?: (call: RttCall) => void
}

const bem = (
  element?: string,
  modifier?: string,
  base: string = "c-rtt-details-panel",
) => base + (element ? "__" + element : "") + (modifier ? "--" + modifier : "")
export const RttDetailsPanel = ({
  call,
  isLive = false,
  onMarkDone,
}: RttDetailsPanelProps): JSX.Element => {
  if (!call) {
    return (
      <aside className={bem()}>
        <div className={bem("empty")}>
          <p>Select a call from the queue to view details</p>
        </div>
      </aside>
    )
  }

  const live = isLive || call.status === "active"

  const classes = joinClasses([bem(), live && bem(undefined, "live")])

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

  const timestampRows = [
    { label: "ANSWERED", time: call.answeredAt },
    { label: "MARKED DONE", time: call.markedDoneAt },
  ].filter(
    (item): item is { label: string; time: NonNullable<typeof item.time> } =>
      Boolean(item.time)
  )

  const detailFields = [
    { label: "Current Location", value: call.currentLocation || "Unknown" },
    { label: "Operator", value: operatorDisplay },
    { label: "Run", value: call.runNumber || "N/A" },
    { label: "Garage", value: call.garage },
    { label: "Talk Group", value: call.talkGroup },
  ].filter((field): field is { label: string; value: string } =>
    Boolean(field.value)
  )

  return (
    <aside className={classes}>
      <div className={bem("header")}>
        <div className={bem("header-info")}>
          <h2 className={bem("title")}>
            <span className={bem("call-type")}>{call.callType}</span>
            <span className={bem("call-time")}>
              {formattedTimeWithSeconds(call.receivedAt)}
            </span>
          </h2>
          {live && (
            <div className={bem("live-tag")}>
              <span className={bem("live-dot")} aria-hidden="true" />
              Live Call
            </div>
          )}
        </div>

        <div className={bem("header-actions")}>
          <div className={bem("timestamps")}>
            {timestampRows.map(({ label, time }) => (
              <div key={label} className={bem("timestamp-row")}>
                <span className={bem("timestamp-label")}>{label}</span>
                <span className={bem("timestamp-val")}>
                  {formattedTimeWithSeconds(time)}
                </span>
              </div>
            ))}
          </div>

          {live && onMarkDone && (
            <button
              type="button"
              className={bem("mark-done-btn")}
              onClick={() => onMarkDone(call)}
            >
              MARK DONE
            </button>
          )}
        </div>
      </div>

      <div className={bem("body")}>
        <div className={bem("hero")}>
          <div
            className={bem("vehicle-badge")}
            aria-label={`Vehicle ${call.vehicleId}`}
          >
            <svg
              className={bem("vehicle-triangle")}
              viewBox="0 0 24 24"
              width="28"
              height="28"
              aria-hidden="true"
            >
              <path d="M12 2L2 22h20L12 2z" />
            </svg>
            <span className={bem("vehicle-id")}>{call.vehicleId}</span>
          </div>

          <div className={bem("hero-route")}>
            {call.direction && (
              <div className={bem("direction")}>
                {call.direction.toUpperCase()}
              </div>
            )}
            <div className={bem("headsign")}>
              {headsignDisplay.toUpperCase()}
            </div>
            {call.adherence && (
              <div className={bem("adherence")}>
                {call.adherence.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className={bem("fields")}>
          {detailFields.map(({ label, value }) => (
            <div key={label} className={bem("field")}>
              <span className={bem("label")}>{label}</span>
              <span className={bem("value")}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
