import { mount } from "enzyme"
import React from "react"
import { act } from "react-dom/test-utils"
import renderer from "react-test-renderer"
import {
  NotificationCard,
  Notifications,
} from "../../src/components/notifications"
import { NotificationsContext } from "../../src/contexts/notificationsContext"
import { Notification, NotificationReason } from "../../src/realtime.d"
import { now } from "../../src/util/dateTime"

jest.mock("../../src/hooks/useNotifications", () => ({
  __esModule: true,
  useNotifications: jest.fn(),
}))

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: () => true,
}))

const notification: Notification = {
  id: 0,
  createdAt: now(),
  reason: "manpower",
  routeIds: ["route1", "route2"],
  runIds: ["run1", "run2"],
  tripIds: [],
  operatorName: null,
  operatorId: null,
  routeIdAtCreation: null,
}

const notificationWithMatchedVehicle: Notification = {
  ...notification,
  operatorName: "operatorName",
  operatorId: "operatorId",
  routeIdAtCreation: "route1",
}

describe("Notification", () => {
  test("renders empty state", () => {
    const tree = renderer.create(<Notifications />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders notifications", () => {
    const notifications = [
      { ...notification, id: 0 },
      { ...notification, id: 1 },
    ]
    const tree = renderer
      .create(
        <NotificationsContext.Provider
          value={{
            notifications,
            removeNotification: jest.fn(),
          }}
        >
          <Notifications />
        </NotificationsContext.Provider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("can close notification", () => {
    const removeNotification = jest.fn()
    const wrapper = mount(
      <NotificationsContext.Provider
        value={{
          notifications: [notification],
          removeNotification,
        }}
      >
        <Notifications />
      </NotificationsContext.Provider>
    )
    expect(wrapper.find(".m-notifications__card")).toHaveLength(1)
    wrapper.find(".m-notifications__close").simulate("click")
    expect(removeNotification).toHaveBeenCalledWith(notification.id)
  })
})

describe("NotificationCard", () => {
  test("renders notification with matched vehicle", () => {
    const tree = renderer
      .create(
        <NotificationCard
          notification={notificationWithMatchedVehicle}
          remove={jest.fn()}
          currentTime={now()}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("transforms reasons into human-readable titles", () => {
    const n: Notification = { ...notification, reason: "operator_error" }
    const wrapper = mount(
      <NotificationCard
        notification={n}
        remove={jest.fn()}
        currentTime={now()}
      />
    )
    expect(wrapper.html()).toContain("OPERATOR ERROR")
  })

  test("uses custom titles if available", () => {
    const n: Notification = { ...notification, reason: "manpower" }
    const wrapper = mount(
      <NotificationCard
        notification={n}
        remove={jest.fn()}
        currentTime={now()}
      />
    )
    expect(wrapper.html()).toContain("NO OPERATOR")
  })

  test("renders a notification with an unexpected reason", () => {
    const n: Notification = { ...notification, reason: "other" }
    const tree = renderer
      .create(
        <NotificationCard
          notification={n}
          remove={jest.fn()}
          currentTime={now()}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("routeIdAtCreation shows when relevant", () => {
    const n: Notification = {
      ...notificationWithMatchedVehicle,
      reason: "accident",
      routeIds: ["r2", "r3"],
      routeIdAtCreation: "r1",
    }
    const wrapper = mount(
      <NotificationCard
        notification={n}
        remove={jest.fn()}
        currentTime={now()}
      />
    )
    expect(wrapper.html()).toContain("r1")
  })

  test("falls back to affected routeIds if routeIdAtCreation is missing", () => {
    const n: Notification = {
      ...notification,
      reason: "accident",
      routeIds: ["r2", "r3"],
      routeIdAtCreation: null,
    }
    const wrapper = mount(
      <NotificationCard
        notification={n}
        remove={jest.fn()}
        currentTime={now()}
      />
    )
    expect(wrapper.html()).toContain("r2, r3")
  })

  test("shows affected routeIds if routeIdAtCreation isn't relevant", () => {
    const n: Notification = {
      ...notificationWithMatchedVehicle,
      reason: "diverted",
      routeIds: ["r2", "r3"],
      routeIdAtCreation: "r1",
    }
    const wrapper = mount(
      <NotificationCard
        notification={n}
        remove={jest.fn()}
        currentTime={now()}
      />
    )
    expect(wrapper.html()).toContain("r2, r3")
  })

  const reasons: NotificationReason[] = [
    "manpower",
    "disabled",
    "diverted",
    "accident",
    "other",
    "adjusted",
    "operator_error",
    "traffic",
  ]
  test.each(reasons)("renders notification with reason %s", (reason) => {
    const n: Notification = { ...notification, reason }
    mount(
      <NotificationCard
        notification={n}
        remove={jest.fn()}
        currentTime={now()}
      />
    )
  })

  test("sets and removes class to animate pop-in", () => {
    jest.useFakeTimers()
    const wrapper = mount(
      <NotificationCard
        notification={notification}
        remove={jest.fn()}
        currentTime={now()}
      />
    )
    expect(wrapper.find(".m-notifications__card--new")).toHaveLength(1)
    act(() => {
      jest.runAllTimers()
    })
    wrapper.update()
    expect(wrapper.find(".m-notifications__card--new")).toHaveLength(0)
  })
})
