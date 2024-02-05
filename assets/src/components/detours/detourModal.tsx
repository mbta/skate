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
      <Modal.Header closeButton>Create Detour</Modal.Header>
      <Modal.Body>
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
