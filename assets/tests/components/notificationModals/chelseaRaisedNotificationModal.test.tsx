import React from "react"
import { mount } from "enzyme"
import ChelseaRaisedNotificationModal from "../../../src/components/notificationModals/chelseaRaisedNotificationModal"
import { Notification, NotificationState } from "../../../src/realtime.d"

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
})
