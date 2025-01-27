import React, { ReactNode } from "react"
import { Button, Modal } from "react-bootstrap"

export const DeleteDetourModal = ({
  onDelete,
  onCancel,
  affectedRoute,
}: {
  onDelete: () => void
  onCancel: () => void
  affectedRoute: ReactNode
}) => {
  return (
    <Modal show animation={false} onHide={onCancel}>
      <Modal.Header closeButton>
        <h3 className="fs-3 fw-semibold lh-sm my-1">Delete Draft</h3>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-row gap-2 mb-3">{affectedRoute}</div>
        <p>Are you sure you want to delete this draft?</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-primary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="ui-alert"
          onClick={onDelete}
          className="text-white"
          data-fs-element="Confirm Delete Draft"
          title="Confirm Delete Draft"
        >
          Delete draft
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
