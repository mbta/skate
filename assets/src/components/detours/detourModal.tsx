import React from "react"
import { Modal } from "react-bootstrap"
import { DiversionPage } from "./diversionPage"
import { StartDetourProps } from "./detourDropdown"

export const DetourModal = ({
  detourInfo,
  onClose,
}: {
  detourInfo: StartDetourProps
  onClose: () => void
}) => {
  return (
    <Modal show fullscreen className="c-modal-fullscreen">
      <Modal.Body className="c-modal-fullscreen-body">
        <DiversionPage
          onClose={onClose}
          routeName={detourInfo.routeName}
          routeDescription={detourInfo.routeDescription}
          routeOrigin={detourInfo.routeOrigin}
          routeDirection={detourInfo.routeDirection}
          shape={detourInfo.shape}
        />
      </Modal.Body>
    </Modal>
  )
}
