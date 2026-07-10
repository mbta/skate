import React from "react"
import { ExclamationCircle } from "../../../helpers/bsIcons"
import BaseAlert from "../../alerts/baseAlert"

export const TextOnlyAlert = (): React.ReactElement => (
  <BaseAlert variant="warning" show={true} className="c-alert__in-sidebar">
    <ExclamationCircle aria-hidden={true} className="c-alert__icon" />
    <span className="d-flex flex-column">
      <strong className="c-alert__header pb-2">Text Only</strong>
      <span className="lh-base">Detour could not be drawn.</span>
      <span className="lh-base">Details entered manually.</span>
    </span>
  </BaseAlert>
)

export const TextOnlyMapAlert = (): React.ReactElement => (
  <div className="c-text-only-alert position-absolute m-2">
    <BaseAlert variant="warning-dark" show={true}>
      <ExclamationCircle aria-hidden={true} className="c-alert__icon" />
      Showing regular route - detour shape not available
    </BaseAlert>
  </div>
)
