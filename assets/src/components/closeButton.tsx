import React from "react"
import { CloseXIcon } from "../helpers/icon"

export type CloseButtonType =
  | "s_light"
  | "l_light"
  | "xl_light"
  | "l_dark"
  | "xl_dark"
  | "s_darker"
  | "l_darker"
  | "l_green"
  | "xl_green"

const buttonTypeClassNames: Record<CloseButtonType, string[]> = {
  s_light: ["m-close-button--small", "m-close-button--light"],
  l_light: ["m-close-button--large", "m-close-button--light"],
  xl_light: ["m-close-button--x-large", "m-close-button--light"],
  l_dark: ["m-close-button--large", "m-close-button--dark"],
  xl_dark: ["m-close-button--x-large", "m-close-button--dark"],
  s_darker: ["m-close-button--small", "m-close-button--darker"],
  l_darker: ["m-close-button--large", "m-close-button--darker"],
  l_green: ["m-close-button--large", "m-close-button--green"],
  xl_green: ["m-close-button--x-large", "m-close-button--green"],
}

export interface CloseButtonProps extends React.HTMLAttributes<HTMLElement> {
  onClick: () => void
  closeButtonType: CloseButtonType
}

export const CloseButton = ({
  onClick,
  closeButtonType,
  ...rest
}: CloseButtonProps) => (
  <button
    aria-label="Close"
    onClick={onClick}
    className={[
      "m-close-button",
      ...buttonTypeClassNames[closeButtonType],
    ].join(" ")}
    {...rest}
  >
    <CloseXIcon role="img" aria-label="" aria-hidden={true} />
  </button>
)

export default CloseButton
