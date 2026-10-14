import React, { PropsWithChildren } from "react"
import { Button } from "react-bootstrap"
import { DurationSelect } from "../durationSelect"
import { formatIfDate, isIsoDateString } from "../../../util/dateTime"
import BaseAlert from "../../alerts/baseAlert"
import inTestGroup, { TestGroups } from "../../../userInTestGroup"
import { BaseModal } from "./baseModal"

interface ChangeDurationModalProps extends PropsWithChildren {
  onCancel: () => void
  onNext?: () => void
  nextStepButton?: string
  modalTitle?: string
}

const ChangeDurationModal = ({
  onCancel,
  onNext,
  nextStepButton = "Done",
  modalTitle = "Change detour duration",
  children,
}: ChangeDurationModalProps) => (
  <BaseModal
    onCancel={onCancel}
    title={modalTitle}
    enforceFocus={false}
    footer={
      <>
        <Button variant="outline-primary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={onNext === undefined}
          onClick={onNext}
          data-fs-element="Confirm Duration"
        >
          {nextStepButton}
        </Button>
      </>
    }
  >
    {children}
  </BaseModal>
)

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
      {inTestGroup(TestGroups.DetourAutoClosingPilot) && duration && (
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
  Modal: ChangeDurationModal,
  Body: ChangingDuration,
}
