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

export const DropdownItem = Dropdown.Item
