import React, { ReactNode } from "react"
import { Button, Modal } from "react-bootstrap"

export const DiscardChangesModal = ({
  onConfirm,
  onCancel,
  affectedRoute,
}: {
  onConfirm: () => void
  onCancel: () => void
  affectedRoute: ReactNode
}) => {
  return (
    <Modal show animation={false} onHide={onCancel}>
      <Modal.Header closeButton>
        <h3 className="fs-3 fw-semibold lh-sm my-1">
          Discard unsaved changes?
        </h3>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-row gap-2 mb-3">{affectedRoute}</div>
        <p>If you close now, your changes will be lost.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-primary" onClick={onCancel}>
          Keep editing
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          className="text-white"
          data-fs-element="Confirm Discard Changes"
          title="Confirm Discard Changes"
        >
          Discard changes
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
