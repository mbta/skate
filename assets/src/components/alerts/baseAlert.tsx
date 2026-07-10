import React from "react"
import { Alert, AlertProps } from "react-bootstrap"

const BaseAlert = ({ className, children, ...props }: AlertProps) => (
  <Alert className={`c-alert icon-link ${className || ""}`} {...props}>
    {children}
  </Alert>
)

export default BaseAlert
