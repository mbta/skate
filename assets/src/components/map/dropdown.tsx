import React, { ComponentProps } from "react"
import { Dropdown } from "react-bootstrap"

export const DropdownMenu = (props: ComponentProps<typeof Dropdown.Menu>) => (
  <Dropdown.Menu
    className="c-dropdown-popup-menu border-box inherit-box"
    show
    {...props}
  />
)

export const DropdownItem = (props: ComponentProps<typeof Dropdown.Item>) => (
  <Dropdown.Item as="button" {...props} />
)
