import { fullStoryIdentify } from "../../src/helpers/fullStory"

const originalFS = window.FS

afterEach(() => {
  window.FS = originalFS
})

describe("fullStoryIdentify", () => {
  test("calls identify if username is given", () => {
    const mockIdentify = jest.fn()
    window.FS = { identify: mockIdentify, event: jest.fn() }

    fullStoryIdentify("username")

    expect(mockIdentify).toHaveBeenCalledWith("username", {
      displayName: "username",
    })
  })

  test("does not call identify if username is undefined", () => {
    const mockIdentify = jest.fn()
    window.FS = { identify: mockIdentify, event: jest.fn() }

    fullStoryIdentify(undefined)
    expect(mockIdentify).not.toHaveBeenCalled()
  })
})
