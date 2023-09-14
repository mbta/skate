import { describe, test, expect } from "@jest/globals"
import { fullStoryIdentify } from "../../src/helpers/fullStory"
import { mockFullStoryEvent } from "../testHelpers/mockHelpers"

describe("fullStoryIdentify", () => {
  test("calls identify if username is given", () => {
    mockFullStoryEvent()

    fullStoryIdentify("username")

    expect(window.FS.identify).toHaveBeenCalledWith("username", {
      displayName: "username",
    })
  })

  test("does not call identify if username is undefined", () => {
    mockFullStoryEvent()

    fullStoryIdentify(undefined)

    expect(window.FS.identify).not.toHaveBeenCalled()
  })
})
