import { jest, describe, test, expect } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render } from "@testing-library/react"
import ViewHeader from "../../src/components/viewHeader"
import userEvent from "@testing-library/user-event"
import useScreenSize from "../../src/hooks/useScreenSize"
import { OpenView } from "../../src/state/pagePanelState"
import { DeviceType } from "../../src/skate"

jest.mock("../../src/hooks/useScreenSize", () => ({
  __esModule: true,
  default: jest.fn(() => "desktop"),
}))

describe("ViewHeader", () => {
  test("close button invokes close callback", async () => {
    const close = jest.fn()
    const user = userEvent.setup()

    const result = render(<ViewHeader title="My View" closeView={close} />)

    await user.click(result.getByRole("button", { name: /close/i }))

    expect(close).toHaveBeenCalled()
  })

  test.each<DeviceType>(["mobile", "mobile_landscape_tablet_portrait"])(
    "backlink renders on %s breakpoint",
    (breakpoint) => {
      jest.mocked(useScreenSize).mockReturnValueOnce(breakpoint)

      const close = jest.fn()
      const followBacklink = jest.fn()

      const result = render(
        <ViewHeader
          title="My View"
          closeView={close}
          backlinkToView={OpenView.Swings}
          followBacklink={followBacklink}
        />
      )

      expect(result.getByTitle("Swings")).toBeInTheDocument()
    }
  )

  test.each<DeviceType>(["tablet", "desktop"])(
    "backlink doesn't render on %s breakpoint",
    (breakpoint) => {
      jest.mocked(useScreenSize).mockReturnValueOnce(breakpoint)

      const close = jest.fn()
      const followBacklink = jest.fn()

      const result = render(
        <ViewHeader
          title="My View"
          closeView={close}
          backlinkToView={OpenView.Swings}
          followBacklink={followBacklink}
        />
      )

      expect(result.queryByTitle("Swings")).toBeNull()
    }
  )

  test("backlink doesn't render when there's no view to return to", () => {
    jest.mocked(useScreenSize).mockImplementationOnce(() => "mobile")

    const close = jest.fn()
    const followBacklink = jest.fn()

    const result = render(
      <ViewHeader
        title="My View"
        closeView={close}
        backlinkToView={OpenView.None}
        followBacklink={followBacklink}
      />
    )

    expect(result.queryAllByRole("button").length).toEqual(1)
  })

  test("backlink button invokes callback", async () => {
    jest.mocked(useScreenSize).mockImplementationOnce(() => "mobile")

    const close = jest.fn()
    const followBacklink = jest.fn()
    const user = userEvent.setup()

    const result = render(
      <ViewHeader
        title="My View"
        closeView={close}
        backlinkToView={OpenView.Swings}
        followBacklink={followBacklink}
      />
    )

    await user.click(result.getByTitle("Swings"))

    expect(followBacklink).toHaveBeenCalled()
  })

  test("backlink button renders for Late View", async () => {
    jest.mocked(useScreenSize).mockImplementationOnce(() => "mobile")

    const close = jest.fn()
    const followBacklink = jest.fn()

    const result = render(
      <ViewHeader
        title="My View"
        closeView={close}
        backlinkToView={OpenView.Late}
        followBacklink={followBacklink}
      />
    )

    expect(result.queryByTitle("Late View")).not.toBeNull()
  })

  test("backlink button render for notifications drawer", async () => {
    jest.mocked(useScreenSize).mockImplementationOnce(() => "mobile")

    const close = jest.fn()
    const followBacklink = jest.fn()

    const result = render(
      <ViewHeader
        title="My View"
        closeView={close}
        backlinkToView={OpenView.NotificationDrawer}
        followBacklink={followBacklink}
      />
    )

    expect(result.queryByTitle("Notifications")).not.toBeNull()
  })
})
