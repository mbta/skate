import React, { PropsWithChildren, useState } from "react"
import BaseAlert from "./baseAlert"
import { CloseButton } from "react-bootstrap"
import { Variant } from "react-bootstrap/esm/types"

// If we just use the `dismissible` prop, the close button is
// positioned absolutely in a way that looks weird, so we need to wrap
// the Alert in our own show state logic.
const DismissableAlert = ({
  variant,
  children,
}: PropsWithChildren<{ variant: Variant }>): React.ReactElement => {
  const [show, setShow] = useState<boolean>(true)

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

export default DismissableAlert
