import React from "react"
import { ReactElement } from "react"
import MapPage from "../components/mapPage"
import SearchPage from "../components/searchPage"
import inTestGroup, { MAP_BETA_GROUP_NAME } from "../userTestGroups"

export interface NavMode {
  path: string
  title: string
  element: ReactElement
}

export const mapModeForUser = (): any =>
  inTestGroup(MAP_BETA_GROUP_NAME)
    ? { path: "/search", title: "Map", element: <MapPage /> }
    : { path: "/search", title: "Search", element: <SearchPage /> }
