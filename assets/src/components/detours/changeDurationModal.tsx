import React from "react"
import { SurroundingModal } from "./activateDetourModal"
import { DurationSelect } from "./durationSelect"

const ChangingDuration = ({
  onSelectDuration,
  selectedDuration,
  editedSelectedDuration,
}: {
  onSelectDuration: (duration: string) => void
  selectedDuration?: string
  editedSelectedDuration?: string
}) => (
  <>
    <span className="mb-4">
      <span className="fw-bold">Previous time length</span>{" "}
      <span>(estimate)</span>
      <p
        className="mt-2 mb-4"
        data-testid="change-detour-duration-previous-time"
      >
        {selectedDuration}
      </p>
    </span>
    <p>
      <span className="fw-bold">New time length</span> <span>(estimate)</span>
    </p>
    <DurationSelect
      selectedDuration={editedSelectedDuration}
      onSelectDuration={onSelectDuration}
    />
  </>
)

export const ChangeDuration = {
  Modal: SurroundingModal,
  Body: ChangingDuration,
}
