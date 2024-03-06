import React, { useEffect } from "react"
import { DiversionPage } from "./diversionPage"
import { OriginalRoute } from "../../models/detour"
import { Modal } from "@restart/ui"
import { ModalTransitionProps } from "@restart/ui/esm/Modal"
import { CSSTransition } from "react-transition-group"

const Fade = ({ children, ...props }: ModalTransitionProps) => (
  <CSSTransition
    timeout={300}
    classNames="c-detour-modal__transition"
    {...props}
  >
    {children}
  </CSSTransition>
)

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
    <Modal className="c-detour-modal" show={show} transition={Fade}>
      <DiversionPage onClose={onClose} originalRoute={originalRoute} />
    </Modal>
  )
}
