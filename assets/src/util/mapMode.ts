import { SearchIcon, SearchMapIcon } from "../helpers/icon"
import inTestGroup, { TestGroups } from "../userInTestGroup"

type HTMLElementProps = React.PropsWithoutRef<React.HTMLAttributes<HTMLElement>>

export interface NavMode {
  path: string
  title: string
  navIcon: React.JSXElementConstructor<HTMLElementProps>
  supportsRightPanel: boolean
  navEventText?: string
}

const legacyMapConfig = {
  path: "/search",
  title: "Search",
  navIcon: SearchIcon,
  supportsRightPanel: true,
}

export const searchMapConfig = {
  path: "/map",
  title: "Search Map",
  navIcon: SearchMapIcon,
  supportsRightPanel: false,
  navEventText: "Search Map nav entry clicked",
}

export const mapModeForUser = (): NavMode =>
  inTestGroup(TestGroups.MapBeta) ? searchMapConfig : legacyMapConfig
