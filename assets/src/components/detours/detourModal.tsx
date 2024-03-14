import React, { useState } from "react"
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
  const [showConfirmCloseModal, setShowConfirmCloseModal] =
    useState<boolean>(false)

  return (
    <Modal
      className="c-detour-modal"
      show={show}
      transition={Fade}
      onHide={() => setShowConfirmCloseModal(true)}
    >
      <DiversionPage
        onClose={() => setShowConfirmCloseModal(true)}
        onConfirmClose={() => {
          setShowConfirmCloseModal(false)
          onClose()
        }}
        onCancelClose={() => setShowConfirmCloseModal(false)}
        originalRoute={originalRoute}
        showConfirmCloseModal={showConfirmCloseModal}
      />
    </Modal>
  )
}
