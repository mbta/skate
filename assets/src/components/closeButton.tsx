import React from "react"
import { closeIcon } from "../helpers/icon"

interface Props {
  onClick: () => void
}

const CloseButton = ({ onClick }: Props) => (
  <button className="m-close-button" onClick={onClick}>
    {closeIcon("m-close-button__icon")}
  </button>
)

export default CloseButton
