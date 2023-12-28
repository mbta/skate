import React from "react"
import { mapModeForUser } from "./util/mapMode"
import { fullStoryEvent } from "./helpers/fullStory"
import { DiamondTurnRightIcon, LadderIcon, MapIcon } from "./helpers/icon"
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
  const mapMode = mapModeForUser()

  const maybeDetours = inTestGroup(TestGroups.DetourPanel)
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
      title: mapMode.title,
      path: mapMode.path,
      navIcon: mapMode.navIcon,
      onClick: () => {
        mapMode.navEventText && fullStoryEvent(mapMode.navEventText, {})
      },
    },
  ].concat(maybeDetours)
}
