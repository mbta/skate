import React from "react"
import { Button } from "react-bootstrap"
import { RoutePill } from "../../routePill"
import { StopCircle } from "../../../helpers/bsIcons"
import { BaseModal } from "./baseModal"

export interface DeactivateDetourModalProps {
  onDeactivate: () => void
  onCancel: () => void
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
}

export const DeactivateDetourModal = ({
  onDeactivate,
  onCancel,
  routeName,
  routeDescription,
  routeOrigin,
  routeDirection,
}: DeactivateDetourModalProps) => {
  return (
    <BaseModal
      title="Return to regular route?"
      onCancel={onCancel}
      footer={
        <>
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
        Are you sure that you want to stop this detour and return to the regular
        route?
      </p>
    </BaseModal>
  )
}
