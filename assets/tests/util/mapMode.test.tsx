import React from "react"
import appData from "../../src/appData"
import MapPage from "../../src/components/mapPage"
import SearchPage from "../../src/components/searchPage"
import { MAP_BETA_GROUP_NAME } from "../../src/userTestGroups"
import { mapModeForUser } from "../../src/util/mapMode"

jest.mock("appData")

describe("mapModeForUser", () => {
  test("returns new map mode when a part of new map test group", () => {
    ;(appData as jest.Mock).mockImplementationOnce(() => ({
      userTestGroups: JSON.stringify([MAP_BETA_GROUP_NAME]),
    }))
    expect(mapModeForUser()).toEqual({
      path: "/map",
      title: "Map",
      element: <MapPage />,
    })
  })

  test("returns old search mode when not a part of new map test group", () => {
    ;(appData as jest.Mock).mockImplementationOnce(() => ({
      userTestGroups: JSON.stringify([]),
    }))
    expect(mapModeForUser()).toEqual({
      path: "/search",
      title: "Search",
      element: <SearchPage />,
    })
  })
})
