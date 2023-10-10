import { describe, test, expect, jest } from "@jest/globals"
import { fullStoryEvent, fullStoryInit } from "../../src/helpers/fullStory"
import * as FullStory from "@fullstory/browser"

jest.mock("@fullstory/browser")

describe("fullStoryInit", () => {
  test("calls init and identify if organization ID and username are given", () => {
    const mockedFS = jest.mocked(FullStory)

    fullStoryInit("org_id", "username")

    expect(mockedFS.init).toHaveBeenCalledWith({ orgId: "org_id" })
    expect(mockedFS.identify).toHaveBeenCalledWith("username", {
      displayName: "username",
    })
  })

  test("doesn't calls init or identify if organization ID is not given", () => {
    const mockedFS = jest.mocked(FullStory)

    fullStoryInit(null, "username")

    expect(mockedFS.init).not.toHaveBeenCalled()
    expect(mockedFS.identify).not.toHaveBeenCalled()
  })

  test("calls init but not identify if username is undefined", () => {
    const mockedFS = jest.mocked(FullStory)

    fullStoryInit("org_id", undefined)

    expect(mockedFS.init).toHaveBeenCalledWith({ orgId: "org_id" })
    expect(mockedFS.identify).not.toHaveBeenCalled()
  })
})

describe("fullStoryEvent", () => {
  test("calls FullStory.event if initialized", () => {
    const mockedFS = jest.mocked(FullStory)

    mockedFS.isInitialized.mockReturnValueOnce(true)

    fullStoryEvent("test_event", { foo: 1 })

    expect(mockedFS.event).toHaveBeenCalledWith("test_event", { foo: 1 })
  })

  test("doesn't call FullStory.event if not initialized", () => {
    const mockedFS = jest.mocked(FullStory)

    mockedFS.isInitialized.mockReturnValueOnce(false)

    fullStoryEvent("test_event", { foo: 1 })

    expect(mockedFS.event).not.toHaveBeenCalled()
  })
})
