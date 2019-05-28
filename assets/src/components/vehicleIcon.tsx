import React from "react"

const VehicleIcon = ({
  isSelected,
  scale,
}: {
  isSelected?: boolean
  scale?: number
}) => {
  const selectedClass = isSelected ? "selected" : ""
  const scaleAmount = scale || 1.0

  return (
    <g className="m-vehicle-icon" transform={`scale(${scaleAmount})`}>
      <path
        className={`m-vehicle-icon__triangle ${selectedClass}`}
        d="m27.34 9.46 16.84 24.54a4.06 4.06 0 0 1 -1 5.64 4.11 4.11 0 0 1 -2.3.71h-33.72a4.06 4.06 0 0 1 -4.06-4.11 4 4 0 0 1 .72-2.24l16.84-24.54a4.05 4.05 0 0 1 5.64-1.05 4 4 0 0 1 1.04 1.05z"
      />
    </g>
  )
}

export default VehicleIcon
