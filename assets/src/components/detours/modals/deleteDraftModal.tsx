import React, { ReactNode } from "react"
import { Button } from "react-bootstrap"
import { BaseModal } from "./baseModal"

export interface DeleteDetourModalProps {
  onDelete: () => void
  onCancel: () => void
  affectedRoute: ReactNode
}

export const DeleteDetourModal = ({
  onDelete,
  onCancel,
  affectedRoute,
}: DeleteDetourModalProps) => {
  return (
    <BaseModal
      title="Delete Draft"
      onCancel={onCancel}
      footer={
        <>
          <Button variant="outline-primary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onDelete}
            className="text-white"
            data-fs-element="Confirm Delete Draft"
            title="Confirm Delete Draft"
          >
            Delete draft
          </Button>
        </>
      }
    >
      <div className="d-flex flex-row gap-2 mb-3">{affectedRoute}</div>
      <p>Are you sure you want to delete this draft?</p>
    </BaseModal>
  )
}
