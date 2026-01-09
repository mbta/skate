import React, { ComponentProps } from "react"
import { fullStoryEvent } from "./helpers/fullStory"
import { LadderIcon, MapIcon, SearchMapIcon } from "./helpers/icon"
import { DetourNavIcon, NavIconProps } from "./helpers/navIcons"
import inTestGroup, { TestGroups } from "./userInTestGroup"

type HTMLElementProps = React.PropsWithoutRef<React.HTMLAttributes<HTMLElement>>

export interface LinkData {
  title: string
  path: string
  navIcon:
    | React.JSXElementConstructor<HTMLElementProps>
    | ((props: NavIconProps) => React.JSX.Element)
  onClick?: () => void
  hideOnMobile?: boolean
}

export interface ButtonData {
  title: string
  onClick: () => void
  NavIcon:
    | React.JSXElementConstructor<HTMLElementProps>
    | ((props: NavIconProps) => React.JSX.Element)
}

export const supportLinkUrl =
  "https://form.asana.com/?k=Prmofhi4iFYNYtsv7_pDWg&d=15492006741476"
