import React from "react"
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
  return (
    <Modal className="c-detour-modal" show={show} transition={Fade}>
      <DiversionPage {...useDetourProps} onClose={onClose} />
    </Modal>
  )
}
