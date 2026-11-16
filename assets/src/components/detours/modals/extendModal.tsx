import React from "react"
import { Button } from "react-bootstrap"
import { RoutePill } from "../../routePill"
import { ClockHistory, StopCircle } from "../../../helpers/bsIcons"
import { BaseModal } from "./baseModal"

export interface ExtendDetourModalProps {
  onDeactivate: () => void
  onCancel: () => void
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
}

export const ExtendDetourModal = ({
  onDeactivate,
  onCancel,
  routeName,
  routeDescription,
  routeOrigin,
  routeDirection,
}: ExtendDetourModalProps) => {
  return (
    <BaseModal
      title="Extend time or close detour"
      onCancel={onCancel}
      footer={
        <>
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
            variant="danger"
            onClick={onDeactivate}
            className="text-white icon-link"
            data-fs-element="Confirm Return to Regular Route"
          >
            <ClockHistory />
            Extend time
          </Button>
        </>
      }
    >
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
    </BaseModal>
  )
}
