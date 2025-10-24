import React from "react"
import ToastAlert from "../../alerts/toastAlert"
import { SuccessCircleIcon } from "../../../helpers/icon"

const CopiedDetourToast = ({
  timeout = 5000,
}: {
  timeout?: number
}): React.ReactElement => {
  return (
    <div className="position-absolute top-0 left-0 mt-2 start-50 translate-middle-x z-1">
      <ToastAlert variant="success" timeout={timeout}>
        <SuccessCircleIcon aria-hidden={true} className="c-alert__icon" />
        Detour copied successfully
      </ToastAlert>
    </div>
  )
}

export default CopiedDetourToast
