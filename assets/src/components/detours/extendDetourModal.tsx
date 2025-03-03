import React from "react"
import { Button, Modal } from "react-bootstrap"
import { RoutePill } from "../routePill"
import { ClockHistory, StopCircle } from "../../helpers/bsIcons"

export const ExtendDetourModal = ({
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
          Extend time or close detour
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
          This detour has reached its estimated <strong>[X HOUR]</strong>{" "}
          duration.
        </p>
        <p>Do you want to extend this detour or close the detour?</p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline-primary"
          className="icon-link"
          onClick={onCancel}
          data-fs-element="Close detour from reminder modal"
        >
          <StopCircle />
          Return to regular route
        </Button>
        <Button
          variant="ui-alert"
          onClick={onDeactivate}
          className="text-white icon-link"
          data-fs-element="Confirm Return to Regular Route"
        >
          <ClockHistory />
          Extend time
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
