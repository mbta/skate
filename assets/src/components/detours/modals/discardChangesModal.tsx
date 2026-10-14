import React, { ReactNode } from "react"
import { Button } from "react-bootstrap"
import { BaseModal } from "./baseModal"

export interface DiscardChangesModalProps {
  onConfirm: () => void
  onCancel: () => void
  affectedRoute: ReactNode
}

export const DiscardChangesModal = ({
  onConfirm,
  onCancel,
  affectedRoute,
}: DiscardChangesModalProps) => {
  return (
    <BaseModal
      title="Discard unsaved changes?"
      onCancel={onCancel}
      footer={
        <>
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
        </>
      }
    >
      <div className="d-flex flex-row gap-2 mb-3">{affectedRoute}</div>
      <p>If you close now, your changes will be lost.</p>
    </BaseModal>
  )
}
