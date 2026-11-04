import React from "react"
import { Button } from "react-bootstrap"
import { BaseModal } from "./baseModal"

export interface ConfirmCantDrawDetourModalProps {
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmCantDrawDetourModal = ({
  onConfirm,
  onCancel,
}: ConfirmCantDrawDetourModalProps) => {
  return (
    <BaseModal
      title="Text-only detour?"
      onCancel={onCancel}
      footer={
        <>
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
        </>
      }
    >
      <p>Are you sure you want to create a text-only detour?</p>
      <p>
        This should only be used when it is impossible to draw the detour in
        Skate.
      </p>
    </BaseModal>
  )
}
