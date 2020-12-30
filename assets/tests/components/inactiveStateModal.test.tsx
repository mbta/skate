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

  test("renders for a notification with no runs", () => {
    const tree = renderer
      .create(<InactiveNotificationModal notification={notification} />)
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders for a notification with one current or past run", () => {
    const tree = renderer
      .create(
        <InactiveNotificationModal
          notification={{ ...notification, runIds: ["111"] }}
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
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
