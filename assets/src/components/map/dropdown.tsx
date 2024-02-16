import React, { PropsWithChildren } from "react"
import { Dropdown } from "react-bootstrap"

interface DropdownMenuProps extends PropsWithChildren {}

export const DropdownMenu = ({ children }: DropdownMenuProps) => {
  return (
    <Dropdown.Menu
      className="c-dropdown-popup-menu border-box inherit-box"
      show
    >
      {children}
    </Dropdown.Menu>
  )
}

interface DropdownItemProps extends PropsWithChildren {
  onClick?: () => void
}

export const DropdownItem = ({ children, onClick }: DropdownItemProps) => {
  return (
    <Dropdown.Item as="button" onClick={onClick}>
      {children}
    </Dropdown.Item>
  )
}
