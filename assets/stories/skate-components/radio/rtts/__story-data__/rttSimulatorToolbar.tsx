import React from "react"
import { RttCallType } from "../../../../../src/components/radio/rtts/types"

export interface RttSimulatorToolbarProps {
  dispatcherName: string
  onSimulateNewCall: (type: RttCallType) => void
  onReset: () => void
}

interface SimulateButtonConfig {
  type: RttCallType
  color: string
}

const SIMULATE_BUTTONS: readonly SimulateButtonConfig[] = [
  { type: "Emergency", color: "#9c074d" },
  { type: "PRTT", color: "#d97706" },
  { type: "RTT", color: "#572e8a" },
]

const toolbarStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0.5rem 1rem",
  backgroundColor: "#fff",
  border: "1px solid #d4d7db",
  borderRadius: "0.375rem",
  fontSize: "0.8125rem",
  flexShrink: 0,
}

const sectionStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
}

export const RttSimulatorToolbar = ({
  dispatcherName,
  onSimulateNewCall,
  onReset,
}: RttSimulatorToolbarProps): JSX.Element => (
  <div style={toolbarStyles}>
    <div style={sectionStyles}>
      <strong>Prototype Simulator:</strong>
      <span>
        Logged in as: <em>{dispatcherName}</em>
      </span>
    </div>

    <div style={sectionStyles}>
      <span>Trigger New Call:</span>
      {SIMULATE_BUTTONS.map(({ type, color }) => (
        <button
          key={type}
          type="button"
          className="c-rtt-queue-item__respond-btn"
          style={{ backgroundColor: color, padding: "0.25rem 0.5rem" }}
          onClick={() => onSimulateNewCall(type)}
        >
          + {type}
        </button>
      ))}
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
