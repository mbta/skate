import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import NotificationDrawer from "../../src/components/notificationDrawer"
import { NotificationsContext } from "../../src/contexts/notificationsContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { Notification, NotificationState } from "../../src/realtime.d"
import {
  closeNotificationDrawer,
  initialState,
  setNotification,
} from "../../src/state"
import { now } from "../../src/util/dateTime"

describe("NotificationDrawer", () => {
  test("renders empty state", () => {
    const tree = renderer.create(<NotificationDrawer />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("close button closes the drawer", () => {
    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <NotificationDrawer />
      </StateDispatchProvider>
    )

    wrapper.find(".m-close-button").first().simulate("click")
    expect(dispatch).toHaveBeenCalledWith(closeNotificationDrawer())
  })

  test("renders notifications", () => {
    const tree = renderer
      .create(
        <NotificationsContext.Provider
          value={{
            notifications: [notification],
            showLatestNotification: true,
            dispatch: jest.fn(),
          }}
        >
          <NotificationDrawer />
        </NotificationsContext.Provider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("clicking a notification tries to open the VPP for it", () => {
    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <NotificationsContext.Provider
          value={{
            notifications: [notification],
            showLatestNotification: true,
            dispatch: jest.fn(),
          }}
        >
          <NotificationDrawer />
        </NotificationsContext.Provider>
      </StateDispatchProvider>
    )

    wrapper.find(".m-notification-drawer__card").first().simulate("click")
    expect(dispatch).toHaveBeenCalledWith(setNotification(notification))
  })
})

const notification: Notification = {
  id: "0",
  createdAt: now(),
  reason: "manpower",
  routeIds: ["route1", "route2"],
  runIds: ["run1", "run2"],
  tripIds: [],
  operatorName: null,
  operatorId: null,
  routeIdAtCreation: null,
  startTime: now(),
  state: "unread" as NotificationState,
}
