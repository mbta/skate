import React from "react"
import { oldCloseIcon } from "../helpers/icon"

interface Props {
  onClick: () => void
}

const OldCloseButton = ({ onClick }: Props) => (
  <button
    data-testid="close-button"
    title="Close"
    className="m-old-close-button"
    onClick={(e) => {
      e.stopPropagation()
      onClick()
    }}
  >
    {oldCloseIcon()}
  </button>
)

export default OldCloseButton
