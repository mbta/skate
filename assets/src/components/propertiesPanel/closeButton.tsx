import React from "react"

interface Props {
  onClick: () => void
}

const CloseButton = ({ onClick }: Props) => (
  <button className="m-properties-panel__close-button" onClick={onClick}>
    Close
  </button>
)

export default CloseButton
