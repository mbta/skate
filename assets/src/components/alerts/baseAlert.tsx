import React, { PropsWithChildren } from "react"
import { Alert } from "react-bootstrap"
import { Variant } from "react-bootstrap/esm/types"

const BaseAlert = ({
  variant: variant,
  show: show,
  children,
}: PropsWithChildren<{
  variant: Variant
  show: boolean
}>): React.ReactElement => {
  return (
    <Alert
      className="c-alert rounded-1 icon-link"
      variant={variant}
      show={show}
    >
      {children}
    </Alert>
  )
}

export default BaseAlert
