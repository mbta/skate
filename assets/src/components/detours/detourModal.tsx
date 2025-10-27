import React from "react"
import { DiversionPage, DiversionPageStateProps } from "./diversionPage"
import { Modal } from "@restart/ui"
import { ModalTransitionProps } from "@restart/ui/esm/Modal"
import { CSSTransition } from "react-transition-group"
import { Spinner } from "react-bootstrap"

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
  onOpenDetour,
  show,
  isLoadingDetour = false,
  ...useDetourProps
}: {
  onClose: () => void
  onOpenDetour?: (detourId: number) => void
  show: boolean
  isLoadingDetour?: boolean
} & DiversionPageStateProps) => {
  return (
    <Modal className="c-detour-modal" show={show} transition={Fade}>
      {isLoadingDetour ? (
        <div className="text-bg-light position-absolute inset-0 opacity-75 d-flex justify-content-center align-items-center">
          <Spinner />
        </div>
      ) : (
        <DiversionPage
          {...useDetourProps}
          onClose={onClose}
          onOpenDetour={onOpenDetour}
        />
      )}
    </Modal>
  )
}
