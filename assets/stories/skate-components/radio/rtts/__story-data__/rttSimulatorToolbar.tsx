import React from "react"
import { RttCallType } from "../../../../../src/components/radio/rtts/types"

export interface RttSimulatorToolbarProps {
  dispatcherName: string
  onSimulateNewCall: (type: RttCallType) => void
  onReset: () => void
}

export const RttSimulatorToolbar = ({
  dispatcherName,
  onSimulateNewCall,
  onReset,
}: RttSimulatorToolbarProps): JSX.Element => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.5rem 1rem",
      backgroundColor: "#fff",
      border: "1px solid #d4d7db",
      borderRadius: "0.375rem",
      fontSize: "0.8125rem",
      flexShrink: 0,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <strong>Prototype Simulator:</strong>
      <span>
        Logged in as: <em>{dispatcherName}</em>
      </span>
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span>Trigger New Call:</span>
      <button
        type="button"
        className="c-rtt-queue-item__respond-btn"
        style={{ backgroundColor: "#9c074d", padding: "0.25rem 0.5rem" }}
        onClick={() => onSimulateNewCall("Emergency")}
      >
        + Emergency
      </button>
      <button
        type="button"
        className="c-rtt-queue-item__respond-btn"
        style={{ backgroundColor: "#d97706", padding: "0.25rem 0.5rem" }}
        onClick={() => onSimulateNewCall("PRTT")}
      >
        + PRTT
      </button>
      <button
        type="button"
        className="c-rtt-queue-item__respond-btn"
        style={{ backgroundColor: "#572e8a", padding: "0.25rem 0.5rem" }}
        onClick={() => onSimulateNewCall("RTT")}
      >
        + RTT
      </button>
      <button
        type="button"
        className="c-rtt-details-panel__mark-done-btn"
        style={{ padding: "0.25rem 0.5rem" }}
        onClick={onReset}
      >
        Reset
      </button>
    </div>
  </div>
)
