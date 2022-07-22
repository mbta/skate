import React from "react"
import { mount } from "enzyme"
import ChelseaLoweredNotificationModal from "../../../src/components/notificationModals/chelseaLoweredNotificationModal"

describe("ChelseaLoweredNotificationModal", () => {

  test("renders notification message", () => {
    const result = mount(
      <ChelseaLoweredNotificationModal />
    )

    expect(result.find(".m-inactive-notification-modal__body").text()).toBe(
      "OCC reported that the Chelsea St Bridge has been lowered."
    )
  })
})
