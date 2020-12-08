import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import InactiveNotificationModal from "../../src/components/inactiveNotificationModal"
import { Notification, NotificationState } from "../../src/realtime.d"

describe("InactiveNotificationModal", () => {
  const notification: Notification = {
    id: "123",
    createdAt: new Date(),
    reason: "other",
    routeIds: [],
    runIds: [],
    tripIds: ["123", "456", "789"],
    operatorName: null,
    operatorId: null,
    routeIdAtCreation: null,
    startTime: new Date("2020-10-05"),
    state: "unread" as NotificationState,
  }
  const futureNotification = {
    ...notification,
    startTime: new Date("20200-10-05"),
  }
  const hideNotification = jest.fn()

  test("renders for a notification with no runs", () => {
    const tree = renderer
      .create(
        <InactiveNotificationModal
          notification={notification}
          hideNotification={hideNotification}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders for a notification with one current or past run", () => {
    const tree = renderer
      .create(
        <InactiveNotificationModal
          notification={{ ...notification, runIds: ["111"] }}
          hideNotification={hideNotification}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders for a notification with multiple current or past runs", () => {
    const tree = renderer
      .create(
        <InactiveNotificationModal
          notification={{ ...notification, runIds: ["111", "222"] }}
          hideNotification={hideNotification}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders for a notification with one upcoming run", () => {
    const tree = renderer
      .create(
        <InactiveNotificationModal
          notification={{ ...futureNotification, runIds: ["111"] }}
          hideNotification={hideNotification}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders for a notification with multiple upcoming runs", () => {
    const tree = renderer
      .create(
        <InactiveNotificationModal
          notification={{ ...futureNotification, runIds: ["111", "222"] }}
          hideNotification={hideNotification}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("allows removing the modal", () => {
    const wrapper = mount(
      <InactiveNotificationModal
        notification={notification}
        hideNotification={hideNotification}
      />
    )

    wrapper
      .find(".m-inactive-notification-modal__discard-button")
      .first()
      .simulate("click")
    expect(hideNotification).toHaveBeenCalled()
  })

  test("allows closing the modal", () => {
    const wrapper = mount(
      <InactiveNotificationModal
        notification={notification}
        hideNotification={hideNotification}
      />
    )

    wrapper
      .find(".m-inactive-notification-modal__keep-button")
      .first()
      .simulate("click")
    expect(hideNotification).not.toHaveBeenCalled()
  })
})
