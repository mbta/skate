import React, { useEffect } from "react"
import { DiversionPage } from "./diversionPage"
import { OriginalRoute } from "../../models/detour"
import Modal from "@restart/ui/Modal"

export const DetourModal = ({
  originalRoute,
  onClose,
  show,
}: {
  originalRoute: OriginalRoute
  onClose: () => void
  show: boolean
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [onClose])

  return (
    <Modal className="c-detour-modal" show={show}>
      <DiversionPage onClose={onClose} originalRoute={originalRoute} />
    </Modal>
  )
}
