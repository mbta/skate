import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import NotificationDrawer from "../../src/components/notificationDrawer"
import { NotificationsContext } from "../../src/contexts/notificationsContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import {
  markAllAsRead,
  toggleReadState,
} from "../../src/hooks/useNotificationsReducer"
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

  test("clicking through an unread notification makes it read", () => {
    const updatedNotification = {
      ...notification,
      tripIds: ["123", "456", "789"],
    }

    const mockNotificationsDispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={jest.fn}>
        <NotificationsContext.Provider
          value={{
            notifications: [updatedNotification],
            showLatestNotification: true,
            dispatch: mockNotificationsDispatch,
          }}
        >
          <NotificationDrawer />
        </NotificationsContext.Provider>
      </StateDispatchProvider>
    )

    wrapper.find(".m-notification-drawer__card--unread").simulate("click")
    expect(mockNotificationsDispatch).toHaveBeenCalledWith(
      toggleReadState(updatedNotification)
    )
  })

  test("can make all read", () => {
    const stateDispatch = jest.fn()
    const notificationsDispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={stateDispatch}>
        <NotificationsContext.Provider
          value={{
            notifications: [notification],
            showLatestNotification: true,
            dispatch: notificationsDispatch,
          }}
        >
          <NotificationDrawer />
        </NotificationsContext.Provider>
      </StateDispatchProvider>
    )

    wrapper
      .find(".m-notification-drawer__mark-all-read-link")
      .first()
      .simulate("click")
    expect(notificationsDispatch).toHaveBeenCalledWith(markAllAsRead())
  })

  test("can make unread to read and vice versa", () => {
    const stateDispatch = jest.fn()
    const notificationsDispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={stateDispatch}>
        <NotificationsContext.Provider
          value={{
            notifications: [notification, readNotification],
            showLatestNotification: true,
            dispatch: notificationsDispatch,
          }}
        >
          <NotificationDrawer />
        </NotificationsContext.Provider>
      </StateDispatchProvider>
    )

    wrapper
      .find(
        ".m-notification-drawer__card--unread .m-notification-drawer__submenu-icon-anchor"
      )
      .simulate("click")
    wrapper
      .find(
        ".m-notification-drawer__card--unread " +
          ".m-notification-drawer__submenu " +
          ".m-notification-drawer__submenu-mark-read"
      )
      .first()
      .simulate("click")
    expect(notificationsDispatch).toHaveBeenCalledWith(
      toggleReadState(notification)
    )

    wrapper
      .find(
        ".m-notification-drawer__card--read .m-notification-drawer__submenu-icon-anchor"
      )
      .simulate("click")
    wrapper
      .find(
        ".m-notification-drawer__card--read " +
          ".m-notification-drawer__submenu " +
          ".m-notification-drawer__submenu-mark-unread"
      )
      .first()
      .simulate("click")
    expect(notificationsDispatch).toHaveBeenCalledWith(
      toggleReadState(readNotification)
    )
  })

  test("clicking any part of the submenu besides the link doesn't cause the VPP to open", () => {
    const stateDispatch = jest.fn()
    const notificationsDispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={stateDispatch}>
        <NotificationsContext.Provider
          value={{
            notifications: [notification],
            showLatestNotification: true,
            dispatch: notificationsDispatch,
          }}
        >
          <NotificationDrawer />
        </NotificationsContext.Provider>
      </StateDispatchProvider>
    )

    wrapper
      .find(
        ".m-notification-drawer__card--unread .m-notification-drawer__submenu-icon-anchor"
      )
      .simulate("click")
    wrapper
      .find(
        ".m-notification-drawer__card--unread .m-notification-drawer__submenu"
      )
      .first()
      .simulate("click")

    expect(notificationsDispatch).not.toHaveBeenCalled()
    expect(stateDispatch).not.toHaveBeenCalled()
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

const readNotification: Notification = {
  ...notification,
  id: "1",
  state: "read" as NotificationState,
}
