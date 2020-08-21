import React from "react"
import renderer, { act } from "react-test-renderer"
import { Notifications } from "../../src/components/notifications"
import { useNotifications } from "../../src/hooks/useNotifications"

jest.mock("../../src/hooks/useNotifications", () => ({
  __esModule: true,
  useNotifications: jest.fn(),
}))

describe("Notification", () => {
  test("does not render", () => {
    const tree = renderer.create(<Notifications />).toJSON()
    expect(tree).toEqual(null)
  })

  test("logs incoming notifications", async () => {
    const spyLog = jest.spyOn(console, "log")
    spyLog.mockImplementation((msg) => msg)
    let handler: (notification: Notification) => void
    ;(useNotifications as jest.Mock).mockImplementationOnce((h) => {
      handler = h
    })
    const notification: Notification = ("notification" as any) as Notification

    renderer.create(<Notifications />).toJSON()

    act(() => {
      handler!(notification)
    })

    expect(spyLog).toHaveBeenCalledWith("notification")
    spyLog.mockRestore()
  })
})
