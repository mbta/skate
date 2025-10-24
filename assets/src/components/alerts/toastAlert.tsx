import React, { useState, useEffect, PropsWithChildren } from "react"
import { CloseButton } from "react-bootstrap"
import BaseAlert from "./baseAlert"
import { Variant } from "react-bootstrap/esm/types"

const ToastAlert = ({
  timeout = 5000,
  variant: variant,
  children,
}: PropsWithChildren<{
  timeout?: number
  variant: Variant
}>): React.ReactElement => {
  const [show, setShow] = useState<boolean>(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout])

  return (
    <BaseAlert variant={variant} show={show}>
      {children}
      <CloseButton
        className="c-alert__close-button"
        onClick={() => setShow(false)}
      />
    </BaseAlert>
  )
}

export default ToastAlert
