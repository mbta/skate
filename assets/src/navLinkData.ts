import React from "react"
import { fullStoryEvent } from "./helpers/fullStory"
import { LadderIcon, MapIcon, SearchMapIcon } from "./helpers/icon"
import inTestGroup, { TestGroups } from "./userInTestGroup"
import { DetourNavIcon, NavIconProps } from "./helpers/navIcons"

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

export const getNavLinkData: () => LinkData[] = () => {
  const maybeDetours = inTestGroup(TestGroups.DetoursList)
    ? [
        {
          title: "Detours",
          path: "/detours",
          navIcon: DetourNavIcon,
        },
      ]
    : []

  const alwaysPresentItems: LinkData[] = [
    {
      title: "Route Ladders",
      path: "/",
      navIcon: LadderIcon,
    },
    {
      title: "Shuttle Map",
      path: "/shuttle-map",
      navIcon: MapIcon,
    },
    {
      title: "Search Map",
      path: "/map",
      navIcon: SearchMapIcon,
      onClick: () => fullStoryEvent("Search Map nav entry clicked", {}),
    },
  ]

  return alwaysPresentItems.concat(maybeDetours)
}
