import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { initialState, setNotification } from "../../../src/state"
import ChelseaRaisedNotificationModal from "../../../src/components/notificationModals/chelseaRaisedNotificationModal"
import { bridgeRaisedNotificationFactory } from "../../factories/notification"

describe("ChelseaRaisedNotificationModal", () => {
  const notification = bridgeRaisedNotificationFactory.build({
    content: {
      loweringTime: new Date("2020-10-06 07:45"),
    },
  })

  const mockDispatch = jest.fn()

  test("renders notification message", () => {
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <ChelseaRaisedNotificationModal notification={notification.content} />
      </StateDispatchProvider>
    )

    expect(
      result.getByText(
        "OCC reported that the Chelsea St Bridge will be raised until 7:45 AM."
      )
    ).toBeTruthy()
  })

  test("close button unsets notification", async () => {
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <ChelseaRaisedNotificationModal notification={notification.content} />
      </StateDispatchProvider>
    )

    const user = userEvent.setup()
    await user.click(result.getByRole("button", { name: /close/i }))
    expect(mockDispatch).toHaveBeenCalledWith(setNotification())
  })
})
