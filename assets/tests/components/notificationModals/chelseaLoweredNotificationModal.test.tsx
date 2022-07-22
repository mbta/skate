import React from "react"
import { mount } from "enzyme"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { initialState, setNotification } from "../../../src/state"
import ChelseaLoweredNotificationModal from "../../../src/components/notificationModals/chelseaLoweredNotificationModal"

describe("ChelseaLoweredNotificationModal", () => {
  test("renders notification message", () => {
    const result = mount(<ChelseaLoweredNotificationModal />)

    expect(result.find(".m-inactive-notification-modal__body").text()).toBe(
      "OCC reported that the Chelsea St Bridge has been lowered."
    )
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
