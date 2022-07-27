import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { initialState, setNotification } from "../../../src/state"
import ChelseaLoweredNotificationModal from "../../../src/components/notificationModals/chelseaLoweredNotificationModal"

describe("ChelseaLoweredNotificationModal", () => {
  const mockDispatch = jest.fn()

  test("renders notification message", () => {
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <ChelseaLoweredNotificationModal />
      </StateDispatchProvider>
    )

    expect(
      result.getByText(
        "OCC reported that the Chelsea St Bridge has been lowered."
      )
    ).toBeTruthy()
  })

  test("close button unsets notification", async () => {
    const mockDispatch = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <ChelseaLoweredNotificationModal />
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Close"))
    expect(mockDispatch).toHaveBeenCalledWith(setNotification())
  })
})
