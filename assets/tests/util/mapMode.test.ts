import { jest, describe, test, expect } from "@jest/globals"
import { mapModeForUser } from "../../src/util/mapMode"
import { SearchIcon, SearchMapIcon } from "../../src/helpers/icon"
import inTestGroup, { TestGroups } from "../../src/userInTestGroup"

jest.mock("../../src/userInTestGroup")

describe("mapModeForUser", () => {
  test("returns new map mode when a part of new map test group", () => {
    jest
      .mocked(inTestGroup)
      .mockImplementation((key) => key === TestGroups.MapBeta)

    expect(mapModeForUser()).toEqual({
      path: "/map",
      title: "Search Map",
      navIcon: SearchMapIcon,
      supportsRightPanel: false,
      navEventText: "Search Map nav entry clicked",
    })
  })

  test("returns old search mode when not a part of new map test group", () => {
    jest.mocked(inTestGroup).mockReturnValue(false)

    expect(mapModeForUser()).toEqual({
      path: "/search",
      title: "Search",
      navIcon: SearchIcon,
      supportsRightPanel: true,
    })
  })
})
