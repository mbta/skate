import React, { ReactNode } from "react"
import { joinClasses } from "../helpers/dom"

export const CircleButton = ({
  children,
  onClick,
  isActive,
}: {
  children: ReactNode
  onClick: () => void
  isActive: boolean
}) => (
  <button
    className={joinClasses([
      "c-circle-button",
      isActive && "c-circle-button--active",
    ])}
    onClick={onClick}
  >
    <div className="c-circle-button__content">{children}</div>
  </button>
)
