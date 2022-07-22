import React from "react"
import { mount } from "enzyme"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { initialState, setNotification } from "../../../src/state"
import { Notification, NotificationState } from "../../../src/realtime.d"
import ChelseaRaisedNotificationModal from "../../../src/components/notificationModals/chelseaRaisedNotificationModal"

describe("ChelseaRaisedNotificationModal", () => {
  const notification: Notification = {
    id: "123",
    createdAt: new Date(),
    reason: "chelsea_st_bridge_raised",
    routeIds: [],
    runIds: [],
    tripIds: ["111", "743"],
    operatorName: null,
    operatorId: null,
    routeIdAtCreation: null,
    startTime: new Date("2020-10-05 07:34"),
    endTime: new Date("2020-10-06 07:45"),
    state: "unread" as NotificationState,
  }

  test("renders notification message", () => {
    const result = mount(
      <ChelseaRaisedNotificationModal notification={notification} />
    )

    expect(result.find(".m-inactive-notification-modal__body").text()).toBe(
      "OCC reported that the Chelsea St Bridge will be raised until 7:45 AM."
    )
  })

  test("close button unsets notification", async () => {
    const mockDispatch = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <ChelseaRaisedNotificationModal notification={notification} />
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Close"))
    expect(mockDispatch).toHaveBeenCalledWith(setNotification())
  })
})
