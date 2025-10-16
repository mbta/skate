import React, { useState, useEffect } from "react"
import { Alert, CloseButton } from "react-bootstrap"
import { SuccessCircleIcon } from "../../../helpers/icon"

const CopiedDetourAlert = (): React.ReactElement => {
  const [show, setShow] = useState<boolean>(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <Alert
      variant="info"
      className="position-absolute top-0 left-0 mt-2 start-50 w-25 translate-middle-x icon-link z-1"
      show={show}
      transition={true}
    >
      <div className="d-flex w-100 align-items-center">
        <SuccessCircleIcon
          aria-hidden={true}
          className="c-copied-detour__success-icon me-2"
        />
        Detour copied successfully
        <CloseButton className="ms-auto" onClick={() => setShow(false)} />
      </div>
    </Alert>
  )
}

export default CopiedDetourAlert
