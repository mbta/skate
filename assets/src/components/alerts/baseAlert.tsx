import React from "react"
import { Alert, AlertProps } from "react-bootstrap"
import { joinClasses } from "../../helpers/dom"

const BaseAlert = ({ className, children, ...props }: AlertProps) => (
  <Alert
    className={joinClasses(["c-alert", "icon-link", className || ""])}
    {...props}
  >
    {children}
  </Alert>
)

export default BaseAlert
