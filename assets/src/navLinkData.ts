import React from "react"
import { fullStoryEvent } from "./helpers/fullStory"
import {
  DiamondTurnRightIcon,
  LadderIcon,
  MapIcon,
  SearchMapIcon,
} from "./helpers/icon"
import inTestGroup, { TestGroups } from "./userInTestGroup"

type HTMLElementProps = React.PropsWithoutRef<React.HTMLAttributes<HTMLElement>>

export interface LinkData {
  title: string
  path: string
  navIcon: React.JSXElementConstructor<HTMLElementProps>
  onClick?: () => void
  hideOnMobile?: boolean
}

export const getNavLinkData: () => LinkData[] = () => {
  const maybeDetours = inTestGroup(TestGroups.DummyDetourPage)
    ? [
        {
          title: "Detours",
          path: "/detours",
          navIcon: DiamondTurnRightIcon,
          hideOnMobile: true,
        },
      ]
    : []

  return [
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
  ].concat(maybeDetours)
}
