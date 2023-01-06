import React from "react"
import { render } from "@testing-library/react"
import ViewHeader from "../../src/components/viewHeader"
import userEvent from "@testing-library/user-event"
import { OpenView } from "../../src/state"
import useScreenSize from "../../src/hooks/useScreenSize"

jest.mock("../../src/hooks/useScreenSize", () => ({
  __esModule: true,
  default: jest.fn(() => "desktop"),
}))

describe("ViewHeader", () => {
  test("close button invokes close callback", async () => {
    const close = jest.fn()
    const user = userEvent.setup()

    const result = render(<ViewHeader title="My View" closeView={close} />)

    await user.click(result.getByTitle("Close"))

    expect(close).toHaveBeenCalled()
  })

  test("backlink doesn't render on non-mobile breakpoints", () => {
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
  })

  test("backlink doesn't render when there's no view to return to", () => {
    ;(useScreenSize as jest.Mock).mockImplementationOnce(() => "mobile")

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
    ;(useScreenSize as jest.Mock).mockImplementationOnce(() => "mobile")

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
    ;(useScreenSize as jest.Mock).mockImplementationOnce(() => "mobile")

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
    ;(useScreenSize as jest.Mock).mockImplementationOnce(() => "mobile")

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
