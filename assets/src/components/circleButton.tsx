import React, { ReactNode } from "react"
import { joinClasses } from "../helpers/dom"

export const CircleButton = ({
  children,
  onClick,
  isActive,
  title,
}: {
  children?: ReactNode
  onClick?: () => void
  isActive: boolean
  title?: string
}) => (
  <button
    className={joinClasses([
      "c-circle-button",
      isActive && "c-circle-button--active",
    ])}
    onClick={onClick}
    title={title}
  >
    <div className="c-circle-button__content">{children}</div>
  </button>
)
