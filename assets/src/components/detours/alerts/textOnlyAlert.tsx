import React from "react"
import { ExclamationTriangleFill } from "../../../helpers/bsIcons"
import BaseAlert from "../../alerts/baseAlert"

const TextOnlyAlert = (): React.ReactElement => (
  <div className="c-text-only-alert position-absolute m-2">
    <BaseAlert variant="warning" show={true}>
      <ExclamationTriangleFill aria-hidden={true} className="c-alert__icon" />
      Showing regular route - detour shape not available
    </BaseAlert>
  </div>
)

export default TextOnlyAlert
