import React from "react"
import { closeIcon } from "../helpers/icon"

interface Props {
  onClick: () => void
}

const CloseButton = ({ onClick }: Props) => (
  <button
    className="m-close-button"
    onClick={(e) => {
      e.stopPropagation()
      onClick()
    }}
  >
    {closeIcon()}
  </button>
)

export default CloseButton
