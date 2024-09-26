import React, { PropsWithChildren } from "react"
import { Button, Form, Modal } from "react-bootstrap"
import { StepperBar } from "../stepperBar"

const possibleDurations = [
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
}

const SurroundingModal = ({
  onCancel,
  onNext,
  onBack,
  onActivate,
  children,
}: SurroundingModalProps) => (
  <Modal show animation={false}>
    <Modal.Header>Start detour</Modal.Header>
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
        <Button variant="primary" onClick={onActivate}>
          Activate detour
        </Button>
      ) : (
        <Button
          variant="primary"
          disabled={onNext === undefined}
          onClick={onNext}
        >
          Next
        </Button>
      )}
    </Modal.Footer>
  </Modal>
)

const SelectingDuration = ({
  onSelectDuration,
  selectedDuration,
}: {
  onSelectDuration: (duration: string) => void
  selectedDuration?: string
}) => (
  <Modal.Body>
    <StepperBar totalSteps={3} currentStep={1} />
    <h5>Step 1 of 3 - Select detour duration</h5>
    <p>
      <span>Time length</span> <span>(estimate)</span>
    </p>
    <Form>
      {possibleDurations.map((duration) => (
        <Form.Check
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
  </Modal.Body>
)

const SelectingReason = ({
  onSelectReason,
  selectedReason,
}: {
  onSelectReason: (reason: string) => void
  selectedReason?: string
}) => (
  <Modal.Body>
    <StepperBar totalSteps={3} currentStep={2} />
    <h5>Step 2 of 3 - Select reason for detour</h5>
    <Form>
      {possibleReasons.map((reason) => (
        <Form.Check
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
  </Modal.Body>
)

const Confirming = () => (
  <Modal.Body>
    <StepperBar totalSteps={3} currentStep={3} />
    <h5>Step 3 of 3 - Activate detour</h5>
    <p>Are you sure that you want to activate this detour?</p>
    <p>
      Once activated, other Skate users and OIOs will be able to see this detour
      information in Skate.
    </p>
    <p>You still need to radio operators and create the log in IRIS.</p>
  </Modal.Body>
)

export const ActivateDetour = {
  Modal: SurroundingModal,
  SelectingDuration,
  SelectingReason,
  Confirming,
}
