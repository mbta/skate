import React from "react"
import { Button, Modal } from "react-bootstrap"

export const ConfirmCantDrawModal = ({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) => {
  return (
    <Modal show animation={false} onHide={onCancel}>
      <Modal.Header closeButton>
        <h3 className="fs-3 fw-semibold lh-sm my-1">Text-only detour?</h3>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to create a text-only detour?</p>
        <p>
          This should only be used when it is impossible to draw the detour in
          Skate.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-primary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          className="text-white"
          data-fs-element="Confirm Create Text Only Detour"
          title="Confirm Create Text Only Detour"
        >
          Create text-only detour
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
