import React from "react"
import { NavIconProps } from "./helpers/navIcons"

type HTMLElementProps = React.PropsWithoutRef<React.HTMLAttributes<HTMLElement>>

export interface LinkData {
  title: string
  path: string
  NavIcon:
    | React.JSXElementConstructor<HTMLElementProps>
    | ((props: NavIconProps) => React.JSX.Element)
  onClick?: () => void
  hideOnMobile?: boolean
}

export interface ButtonData {
  title: string
  NavIcon:
    | React.JSXElementConstructor<HTMLElementProps>
    | ((props: NavIconProps) => React.JSX.Element)
  onClick: () => void
  viewIsOpen?: boolean
  disabled?: boolean
}

export const supportLinkUrl =
  "https://form.asana.com/?k=Prmofhi4iFYNYtsv7_pDWg&d=15492006741476"
