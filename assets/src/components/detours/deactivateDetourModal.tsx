import React from "react"
import { Button, Modal } from "react-bootstrap"

export const DeactivateDetourModal = ({
  onDeactivate,
  onCancel,
}: {
  onDeactivate: () => void
  onCancel: () => void
}) => {
  return (
    <Modal show animation={false}>
      <Modal.Header role="heading">Return to regular route?</Modal.Header>
      <Modal.Body>
        Are you sure that you want to stop this detour and return to the regular
        route?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-primary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="ui-alert"
          onClick={onDeactivate}
          className="text-white"
        >
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
