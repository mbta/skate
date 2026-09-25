import React from "react"
import { SurroundingModal } from "./activateDetourModal"
import { DurationSelect } from "./durationSelect"
import { formatIfDate, isIsoDateString } from "../../util/dateTime"
import BaseAlert from "../alerts/baseAlert"

const ChangingDuration = ({
  onSelectDuration,
  selectedDuration,
  editedSelectedDuration,
}: {
  onSelectDuration: (duration: string | undefined) => void
  selectedDuration?: string
  editedSelectedDuration?: string
}) => {
  const duration = editedSelectedDuration ?? selectedDuration

  return (
    <>
      <span className="mb-4">
        <span className="fw-bold">Previous time length</span>{" "}
        <span>(estimate)</span>
        <p
          className="mt-2 mb-4"
          data-testid="change-detour-duration-previous-time"
        >
          {formatIfDate(selectedDuration)}
        </p>
      </span>
      <p>
        <span className="fw-bold">New time length</span> <span>(estimate)</span>
      </p>
      <DurationSelect
        selectedDuration={duration}
        onSelectDuration={onSelectDuration}
      />
      {duration && (
        <BaseAlert variant="secondary" className="mt-3 mb-0">
          Detour will close automatically{" "}
          {isIsoDateString(duration)
            ? `on ${formatIfDate(duration)} at the end of service.`
            : "at the end of service."}
        </BaseAlert>
      )}
    </>
  )
}

export const ChangeDuration = {
  Modal: SurroundingModal,
  Body: ChangingDuration,
}
