import React from "react"
import { closeXIcon } from "../helpers/icon"

export type CloseButtonType =
  | "s_light"
  | "l_light"
  | "xl_light"
  | "s_dark"
  | "l_dark"
  | "l_green"
  | "xl_green"

const buttonTypeClassNames: Record<CloseButtonType, string[]> = {
  s_light: ["m-close-button--small", "m-close-button--light"],
  l_light: ["m-close-button--large", "m-close-button--light"],
  xl_light: ["m-close-button--x-large", "m-close-button--light"],
  s_dark: ["m-close-button--small", "m-close-button--dark"],
  l_dark: ["m-close-button--large", "m-close-button--dark"],
  l_green: ["m-close-button--large", "m-close-button--green"],
  xl_green: ["m-close-button--x-large", "m-close-button--green"],
}

interface Props {
  onClick: () => void
  closeButtonType: CloseButtonType
}

const CloseButton: React.FC<Props> = ({ onClick, closeButtonType }) => {
  const className = [
    "m-close-button",
    ...buttonTypeClassNames[closeButtonType],
  ].join(" ")

  return (
    <button onClick={onClick} className={className} title="Close">
      {closeXIcon()}
    </button>
  )
}

export default CloseButton
