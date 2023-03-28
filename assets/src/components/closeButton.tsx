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
  s_light: ["c-close-button--small", "c-close-button--light"],
  l_light: ["c-close-button--large", "c-close-button--light"],
  xl_light: ["c-close-button--x-large", "c-close-button--light"],
  l_dark: ["c-close-button--large", "c-close-button--dark"],
  xl_dark: ["c-close-button--x-large", "c-close-button--dark"],
  s_darker: ["c-close-button--small", "c-close-button--darker"],
  l_darker: ["c-close-button--large", "c-close-button--darker"],
  l_green: ["c-close-button--large", "c-close-button--green"],
  xl_green: ["c-close-button--x-large", "c-close-button--green"],
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
      "c-close-button",
      ...buttonTypeClassNames[closeButtonType],
    ].join(" ")}
    {...rest}
  >
    <CloseXIcon role="img" aria-label="" aria-hidden={true} />
  </button>
)

export default CloseButton
