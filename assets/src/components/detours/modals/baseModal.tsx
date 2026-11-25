import React, { PropsWithChildren, ReactNode } from "react"
import { Modal } from "react-bootstrap"

export interface BaseModalProps extends PropsWithChildren {
  onCancel: () => void
  title: string | ReactNode
  footer?: ReactNode
  enforceFocus?: boolean
  className?: string
}

export const BaseModal = ({
  onCancel,
  title,
  children,
  footer,
  enforceFocus = false,
  className,
}: BaseModalProps) => (
  <Modal
    show
    animation={false}
    onHide={onCancel}
    enforceFocus={enforceFocus}
    className={className}
  >
    <Modal.Header closeButton>
      <h3 className="fs-3 fw-semibold lh-sm my-1">{title}</h3>
    </Modal.Header>
    <Modal.Body>{children}</Modal.Body>
    {footer && <Modal.Footer>{footer}</Modal.Footer>}
  </Modal>
)
