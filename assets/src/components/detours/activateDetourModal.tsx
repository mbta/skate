import React, { PropsWithChildren } from "react"
import { Button, Form, Modal } from "react-bootstrap"
import { StepperBar } from "../stepperBar"

export const possibleDurations = [
  "1 hour",
  "2 hours",
  "3 hours",
  "4 hours",
  "5 hours",
  "6 hours",
  "7 hours",
  "8 hours",
  "Until end of service",
  "Until further notice",
]

const possibleReasons = [
  "Accident",
  "Construction",
  "Demonstration",
  "Disabled bus",
  "Drawbridge being raised",
  "Electrical work",
  "Fire",
  "Hazmat condition",
  "Holiday",
  "Hurricane",
  "Maintenance",
  "Medical emergency",
  "Parade",
  "Police activity",
  "Snow",
  "Special event",
  "Tie replacement",
  "Traffic",
  "Weather",
]

interface SurroundingModalProps extends PropsWithChildren {
  onCancel: () => void
  onNext?: () => void
  onBack?: () => void
  onActivate?: () => void
  nextStepButton?: string
  modalTitle?: string
  isActiveDetour?: boolean
}

interface FSElementProps {
  nextStepLabel: string | undefined
}

export const SurroundingModal = ({
  onCancel,
  onNext,
  onBack,
  onActivate,
  children,
  nextStepLabel,
  nextStepButton,
  modalTitle,
  isActiveDetour,
}: SurroundingModalProps & FSElementProps) => (
  <Modal show animation={false} onHide={onCancel}>
    <Modal.Header closeButton>
      <h3 className="fs-3 fw-semibold lh-sm my-1">
        {modalTitle || isActiveDetour ? "Update detour" : "Start detour"}
      </h3>
    </Modal.Header>
    <Modal.Body>{children}</Modal.Body>
    <Modal.Footer>
      {onBack && (
        <Button variant="outline-primary" className="me-auto" onClick={onBack}>
          Back
        </Button>
      )}
      <Button variant="outline-primary" onClick={onCancel}>
        Cancel
      </Button>
      {onActivate ? (
        <Button
          variant="primary"
          onClick={onActivate}
          data-fs-element={`Confirm ${
            isActiveDetour ? "Update" : "Activate"
          } Detour`}
        >
          {isActiveDetour ? "Update detour" : "Activate detour"}
        </Button>
      ) : (
        <Button
          variant="primary"
          disabled={onNext === undefined}
          onClick={onNext}
          data-fs-element={nextStepLabel}
        >
          {nextStepButton || "Next"}
        </Button>
      )}
    </Modal.Footer>
  </Modal>
)

interface StepSubtitleProps extends PropsWithChildren {}
const StepSubtitle = ({ children }: StepSubtitleProps) => (
  <h5 className="fs-5 fw-semibold mb-3 mt-1">{children}</h5>
)

const SelectingDuration = ({
  onSelectDuration,
  selectedDuration,
}: {
  onSelectDuration: (duration: string) => void
  selectedDuration?: string
}) => (
  <>
    <StepperBar totalSteps={3} currentStep={1} />
    <StepSubtitle>Step 1 of 3 - Select detour duration</StepSubtitle>
    <p>
      <span className="fw-bold">Time length</span> <span>(estimate)</span>
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
          checked={selectedDuration === duration}
        />
      ))}
    </Form>
  </>
)

const SelectingReason = ({
  onSelectReason,
  selectedReason,
}: {
  onSelectReason: (reason: string) => void
  selectedReason?: string
}) => (
  <>
    <StepperBar totalSteps={3} currentStep={2} />
    <StepSubtitle>Step 2 of 3 - Select reason for detour</StepSubtitle>
    <Form>
      {possibleReasons.map((reason) => (
        <Form.Check
          className="mb-2"
          onChange={() => {
            onSelectReason(reason)
          }}
          id={`reason-${reason}`}
          key={`reason-${reason}`}
          type="radio"
          label={reason}
          checked={selectedReason === reason}
        />
      ))}
    </Form>
  </>
)

const Confirming = ({ isActiveDetour }: { isActiveDetour: boolean }) => (
  <>
    <StepperBar totalSteps={3} currentStep={3} />
    <StepSubtitle>
      Step 3 of 3 - {isActiveDetour ? "Update" : "Activate"} detour
    </StepSubtitle>
    <p>Are you sure that you want to activate this detour?</p>
    <p>
      Once activated, other Skate users and OIOs will be able to see this detour
      information in Skate.
    </p>
    <p>You still need to radio operators and create the log in IRIS.</p>
  </>
)

export const ActivateDetour = {
  Modal: SurroundingModal,
  SelectingDuration,
  SelectingReason,
  Confirming,
}
