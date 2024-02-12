import React, { ReactNode } from "react"

export const CircleButton = ({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) => (
  <button className="c-circle-button" onClick={onClick}>
    <div className="c-circle-button__content">{children}</div>
  </button>
)
