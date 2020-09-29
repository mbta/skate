import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import InactiveNotificationModal from "../../src/components/inactiveNotificationModal"
import { Notification } from "../../src/realtime.d"

describe("InactiveNotificationModal", () => {
  const notification: Notification = {
    id: 123,
    createdAt: new Date(),
    reason: "other",
    routeIds: [],
    runIds: [],
    tripIds: ["123", "456", "789"],
    operatorName: null,
    operatorId: null,
    routeIdAtCreation: null,
  }
  const removeNotification = jest.fn()
  const setInactiveNotification = jest.fn()

  test("renders for a notification with no runs", () => {
    const tree = renderer
      .create(
        <InactiveNotificationModal
          notification={notification}
          removeNotification={removeNotification}
          setInactiveNotification={setInactiveNotification}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders for a notification with one run", () => {
    const tree = renderer
      .create(
        <InactiveNotificationModal
          notification={{ ...notification, runIds: ["111"] }}
          removeNotification={removeNotification}
          setInactiveNotification={setInactiveNotification}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders for a notification with multiple runs", () => {
    const tree = renderer
      .create(
        <InactiveNotificationModal
          notification={{ ...notification, runIds: ["111", "222"] }}
          setInactiveNotification={setInactiveNotification}
          removeNotification={removeNotification}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("allows removing the modal", () => {
    const wrapper = mount(
      <InactiveNotificationModal
        notification={notification}
        removeNotification={removeNotification}
        setInactiveNotification={setInactiveNotification}
      />
    )

    wrapper
      .find(".m-invalid-notification-modal__discard-button")
      .first()
      .simulate("click")
    expect(removeNotification).toHaveBeenCalledWith(notification.id)
    expect(setInactiveNotification).toHaveBeenCalledWith(null)
  })

  test("allows closing the modal", () => {
    const wrapper = mount(
      <InactiveNotificationModal
        notification={notification}
        removeNotification={removeNotification}
        setInactiveNotification={setInactiveNotification}
      />
    )

    wrapper
      .find(".m-invalid-notification-modal__keep-button")
      .first()
      .simulate("click")
    expect(removeNotification).not.toHaveBeenCalled()
    expect(setInactiveNotification).toHaveBeenCalledWith(null)
  })
})
