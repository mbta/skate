import React, { PropsWithChildren } from "react"
import * as BsIcons from "../../../helpers/bsIcons"
import DismissableAlert from "../../alerts/dismissableAlert"

const RoutingErrorAlert = ({
  children,
}: PropsWithChildren): React.ReactElement => {
  return (
    <div className="position-absolute top-0 left-0 mt-3 start-50 translate-middle-x z-1">
      <DismissableAlert variant="danger">
        <BsIcons.ExclamationTriangleFill />
        {children ?? "Something went wrong. Please try again."}
      </DismissableAlert>
    </div>
  )
}

export default RoutingErrorAlert
