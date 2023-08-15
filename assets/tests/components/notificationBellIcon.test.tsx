import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import NotificationBellIcon from "../../src/components/notificationBellIcon"
import {
  NotificationsContext,
  State as NotificationsState,
} from "../../src/contexts/notificationsContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { Notification } from "../../src/realtime"
import { initialState, OpenView } from "../../src/state"

const unreadNotification: Notification = {
  id: "1",
  createdAt: new Date(0),
  reason: "other",
  routeIds: [],
  runIds: [],
  tripIds: [],
  startTime: new Date(0),
  endTime: new Date(100),
  operatorName: null,
  operatorId: null,
  routeIdAtCreation: null,
  state: "unread",
}

const readNotification: Notification = { ...unreadNotification, state: "read" }

const unreadNotificationState: NotificationsState = {
  notifications: [unreadNotification],
  showLatestNotification: true,
  dispatch: jest.fn(),
  notificationWithOpenSubmenuId: null,
  setNotificationWithOpenSubmenuId: jest.fn(),
}

const readNotificationState: NotificationsState = {
  ...unreadNotificationState,
  notifications: [readNotification],
}

describe("NotificationBellIcon", () => {
  test("renders when the drawer is closed and there are new notifications", () => {
    const state = { ...initialState, openView: OpenView.None }
    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <NotificationsContext.Provider value={unreadNotificationState}>
            <NotificationBellIcon />
          </NotificationsContext.Provider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders when the drawer is open and there are new notifications", () => {
    const state = { ...initialState, openView: OpenView.NotificationDrawer }
    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <NotificationsContext.Provider value={unreadNotificationState}>
            <NotificationBellIcon />
          </NotificationsContext.Provider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders when the drawer is closed and there are not new notifications", () => {
    const state = { ...initialState, openView: OpenView.None }
    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <NotificationsContext.Provider value={readNotificationState}>
            <NotificationBellIcon />
          </NotificationsContext.Provider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders when the drawer is open and there are not new notifications", () => {
    const state = { ...initialState, openView: OpenView.NotificationDrawer }
    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <NotificationsContext.Provider value={readNotificationState}>
            <NotificationBellIcon />
          </NotificationsContext.Provider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
