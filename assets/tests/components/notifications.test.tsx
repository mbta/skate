import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import {
  Notifications,
  NotificationCard,
} from "../../src/components/notifications"
import { useNotifications } from "../../src/hooks/useNotifications"
import { Notification } from "../../src/realtime.d"
import { now } from "../../src/util/dateTime"
import { mockUseStateOnce } from "../testHelpers/mockHelpers"
import { act } from "react-dom/test-utils"

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
    const n = { ...notification, reason: "operator_error" }
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
    const n = { ...notification, reason: "manpower" }
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
    const n = { ...notification, reason: "weird reason" }
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
})
