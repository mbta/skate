import React, { PropsWithChildren } from "react"
import { InfoCircleIcon } from "../../../helpers/icon"
import BaseAlert from "../../alerts/baseAlert"

const DetourDrawingAlert = ({
  children,
}: PropsWithChildren): React.ReactElement => (
  <div className="position-absolute top-0 left-0 m-2 z-1">
    <BaseAlert variant="secondary" show={true}>
      <InfoCircleIcon aria-hidden={true} className="c-alert__icon" />
      {children}
    </BaseAlert>
  </div>
)

export default DetourDrawingAlert
