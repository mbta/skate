import React, { useState, useEffect } from "react"
import { Alert, CloseButton } from "react-bootstrap"
import { SuccessCircleIcon } from "../../../helpers/icon"

const CopiedDetourAlert = ({
  timeout = 5000,
}: {
  timeout?: number
}): React.ReactElement => {
  const [show, setShow] = useState<boolean>(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout])

  return (
    <Alert
      variant="info"
      className="c-copied-detour__alert position-absolute top-0 left-0 mt-2 start-50 translate-middle-x icon-link z-1"
      show={show}
    >
      <SuccessCircleIcon
        aria-hidden={true}
        className="c-copied-detour__success-icon"
      />
      Detour copied successfully
      <CloseButton
        className="c-copied-detour__close-button p-1"
        onClick={() => setShow(false)}
      />
    </Alert>
  )
}

export default CopiedDetourAlert
