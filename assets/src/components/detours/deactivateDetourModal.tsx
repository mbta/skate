import React from "react"
import { Button, Modal } from "react-bootstrap"
import { RoutePill } from "../routePill"
import { StopCircle } from "../../helpers/bsIcons"

export const DeactivateDetourModal = ({
  onDeactivate,
  onCancel,
  routeName,
  routeDescription,
  routeOrigin,
  routeDirection,
}: {
  onDeactivate: () => void
  onCancel: () => void
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
}) => {
  return (
    <Modal show animation={false} onHide={onCancel}>
      <Modal.Header closeButton>
        <h3 className="fs-3 fw-semibold lh-sm my-1">
          Return to regular route?
        </h3>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-row gap-2 mb-3">
          <RoutePill routeName={routeName} />
          <div>
            <div className="fw-semibold mb-1">{routeDescription}</div>
            <div className="fw-normal text-body-secondary fs-6 mb-1">
              from {routeOrigin.split(" - ")[0]}
            </div>
            <div className="fw-normal fs-6">{routeDirection}</div>
          </div>
        </div>
        <p>
          Are you sure that you want to stop this detour and return to the
          regular route?
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-primary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={onDeactivate}
          className="text-white icon-link"
          data-fs-element="Confirm Return to Regular Route"
        >
          <StopCircle />
          Return to regular route
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
