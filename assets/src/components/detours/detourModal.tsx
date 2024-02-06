import React from "react"
import { Modal } from "react-bootstrap"
import { DiversionPage } from "./diversionPage"
import { StartDetourProps } from "./detourDropdown"

export const DetourModal = ({
  detourInfo,
}: {
  detourInfo: StartDetourProps
}) => {
  return (
    <Modal show fullscreen className="c-modal-fullscreen">
      <Modal.Body className="c-modal-fullscreen-body">
        <DiversionPage
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
