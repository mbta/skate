import React, { useState } from "react"
import { DiversionPage, DiversionPageStateProps } from "./diversionPage"
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
  onClose,
  show,
  ...useDetourProps
}: {
  onClose: () => void
  show: boolean
} & DiversionPageStateProps) => {
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
        {...useDetourProps}
        onClose={() => setShowConfirmCloseModal(true)}
        onConfirmClose={() => {
          setShowConfirmCloseModal(false)
          onClose()
        }}
        onCancelClose={() => setShowConfirmCloseModal(false)}
        showConfirmCloseModal={showConfirmCloseModal}
      />
    </Modal>
  )
}
