import React from "react"
import MapPage from "../../src/components/mapPage"
import SearchPage from "../../src/components/searchPage"
import { SearchIcon, SearchMapIcon } from "../../src/helpers/icon"
import { TestGroups } from "../../src/userInTestGroup"
import getTestGroups from "../../src/userTestGroups"
import { mapModeForUser } from "../../src/util/mapMode"

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

describe("mapModeForUser", () => {
  test("returns new map mode when a part of new map test group", () => {
    ;(getTestGroups as jest.Mock).mockReturnValueOnce([TestGroups.MapBeta])
    expect(mapModeForUser()).toEqual({
      path: "/map",
      title: "Search Map",
      element: <MapPage />,
      navIcon: SearchMapIcon,
      supportsRightPanel: false,
      navEventText: "Search Map nav entry clicked",
    })
  })

  test("returns old search mode when not a part of new map test group", () => {
    ;(getTestGroups as jest.Mock).mockReturnValueOnce([])

    expect(mapModeForUser()).toEqual({
      path: "/search",
      title: "Search",
      element: <SearchPage />,
      navIcon: SearchIcon,
      supportsRightPanel: true,
    })
  })
})
