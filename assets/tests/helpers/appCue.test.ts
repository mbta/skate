import { jest, describe, test, expect } from "@jest/globals"
import { displayHelp } from "../../src/helpers/appCue"
import { locationForPath } from "../testHelpers/locationHelpers"

window.Appcues = {
  identify: jest.fn(),
  page: jest.fn(),
  show: jest.fn(),
}

describe("displayHelp", () => {
  test("displays route ladders page help", () => {
    displayHelp(locationForPath("/"))

    expect(window.Appcues!.show).toHaveBeenCalledWith("-M2dVpHSaOJ4PddV1K9i")
  })

  test("displays shuttle map page help", () => {
    displayHelp(locationForPath("/shuttle-map"))

    expect(window.Appcues!.show).toHaveBeenCalledWith("-M2i04n1MzdepApShKRj")
  })

  test("displays settings page help", () => {
    displayHelp(locationForPath("/settings"))

    expect(window.Appcues!.show).toHaveBeenCalledWith("-M3lWY6d4P9iQqah5Qjz")
  })

  test("displays search page help", () => {
    displayHelp(locationForPath("/search"))

    expect(window.Appcues!.show).toHaveBeenCalledWith("-M2iXlrreUJAdmvj29GV")
  })

  test("displays nothing when unknown path is given", () => {
    displayHelp(locationForPath("/foo"))

    expect(window.Appcues!.show).not.toHaveBeenCalled()
  })
})
