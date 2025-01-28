import React from "react"
import { Form } from "react-bootstrap"
import { possibleDurations, SurroundingModal } from "./activateDetourModal"

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
      <p className="mt-2 mb-4" data-testid="change-detour-duration-previous-time">
        {selectedDuration}
      </p>
    </span>
    <p>
      <span className="fw-bold">New time length</span> <span>(estimate)</span>
    </p>
    <Form>
      {possibleDurations.map((duration) => (
        <Form.Check
          className="mb-2"
          onChange={() => {
            onSelectDuration(duration)
          }}
          id={`duration-${duration}`}
          key={`duration-${duration}`}
          type="radio"
          label={duration}
          checked={editedSelectedDuration === duration}
        />
      ))}
    </Form>
  </>
)

export const ChangeDuration = {
  Modal: SurroundingModal,
  Body: ChangingDuration,
}
