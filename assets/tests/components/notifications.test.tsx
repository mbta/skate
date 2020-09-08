import { mount } from "enzyme"
import React from "react"
import { act } from "react-dom/test-utils"
import renderer from "react-test-renderer"
import {
  NotificationCard,
  Notifications,
} from "../../src/components/notifications"
import { useNotifications } from "../../src/hooks/useNotifications"
import { Notification, NotificationReason } from "../../src/realtime.d"
import { now } from "../../src/util/dateTime"
import { mockUseStateOnce } from "../testHelpers/mockHelpers"

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
}

describe("Notification", () => {
  test("renders empty state", () => {
    const tree = renderer.create(<Notifications />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders notifications", () => {
    mockUseStateOnce([
      { ...notification, id: 0 },
      { ...notification, id: 1 },
    ])
    const tree = renderer.create(<Notifications />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("receives incoming notifications", () => {
    let handler: (notification: Notification) => void
    ;(useNotifications as jest.Mock).mockImplementationOnce((h) => {
      handler = h
    })
    const wrapper = mount(<Notifications />)
    expect(wrapper.find(".m-notifications__card")).toHaveLength(0)
    act(() => {
      handler!(notification)
    })
    wrapper.update()
    expect(wrapper.find(".m-notifications__card")).toHaveLength(1)
  })

  test("can close notification", () => {
    mockUseStateOnce([notification])
    const wrapper = mount(<Notifications />)
    expect(wrapper.find(".m-notifications__card")).toHaveLength(1)
    wrapper.find(".m-notifications__close").simulate("click")
    expect(wrapper.find(".m-notifications__card")).toHaveLength(0)
  })
})

describe("NotificationCard", () => {
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
