import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import NotificationBellIcon from "../../src/components/notificationBellIcon"
import {
  NotificationsContext,
  State as NotificationsState,
} from "../../src/contexts/notificationsContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { Notification } from "../../src/realtime"
import { OpenView } from "../../src/state/pagePanelState"
import stateFactory from "../factories/applicationState"
import { viewFactory } from "../factories/pagePanelStateFactory"
import {
  blockWaiverNotificationFactory,
  detourActivatedNotificationFactory,
} from "../factories/notification"
import getTestGroups from "../../src/userTestGroups"
import { TestGroups } from "../../src/userInTestGroup"
import { render } from "@testing-library/react"

jest.mock("../../src/userTestGroups")

beforeEach(() => {
  jest.mocked(getTestGroups).mockReturnValue([])
})

const unreadNotification: Notification = blockWaiverNotificationFactory.build({
  createdAt: new Date(0),
  state: "unread",
  content: {
    reason: "other",
    createdAt: new Date(0),

    routeIds: [],
    runIds: [],
    tripIds: [],

    startTime: new Date(0),
    endTime: new Date(100),

    operatorName: null,
    operatorId: null,
    routeIdAtCreation: null,
  },
})

const unreadDetourNotification: Notification =
  detourActivatedNotificationFactory.build({
    createdAt: new Date(0),
    state: "unread",
  })

const readNotification: Notification = { ...unreadNotification, state: "read" }

const unreadNotificationState: NotificationsState = {
  notifications: [unreadNotification],
  showLatestNotification: true,
  dispatch: jest.fn(),
  notificationWithOpenSubmenuId: null,
  setNotificationWithOpenSubmenuId: jest.fn(),
}

const unreadDetourNotificationState: NotificationsState = {
  ...unreadNotificationState,
  notifications: [unreadDetourNotification],
}

const readNotificationState: NotificationsState = {
  ...unreadNotificationState,
  notifications: [readNotification],
}

describe("NotificationBellIcon", () => {
  test("renders when the drawer is closed and there are new notifications", () => {
    const tree = renderer
      .create(
        <StateDispatchProvider
          state={stateFactory.build()}
          dispatch={jest.fn()}
        >
          <NotificationsContext.Provider value={unreadNotificationState}>
            <NotificationBellIcon />
          </NotificationsContext.Provider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders when the drawer is open and there are new notifications", () => {
    const state = stateFactory.build({
      view: viewFactory
        .currentState({
          openView: OpenView.NotificationDrawer,
        })
        .build(),
    })
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
    const tree = renderer
      .create(
        <StateDispatchProvider
          state={stateFactory.build()}
          dispatch={jest.fn()}
        >
          <NotificationsContext.Provider value={readNotificationState}>
            <NotificationBellIcon />
          </NotificationsContext.Provider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders when the drawer is open and there are not new notifications", () => {
    const state = stateFactory.build({
      view: viewFactory
        .currentState({ openView: OpenView.NotificationDrawer })
        .build(),
    })
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

  test("renders when there are new detour notifications and user is part of DetoursList group", () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursList])

    const { baseElement } = render(
      <StateDispatchProvider state={stateFactory.build()} dispatch={jest.fn()}>
        <NotificationsContext.Provider value={unreadDetourNotificationState}>
          <NotificationBellIcon />
        </NotificationsContext.Provider>
      </StateDispatchProvider>
    )

    expect(baseElement).toMatchSnapshot()
  })

  test("renders when there are new detour notifications and user is not part of DetoursList", () => {
    const { baseElement } = render(
      <StateDispatchProvider state={stateFactory.build()} dispatch={jest.fn()}>
        <NotificationsContext.Provider value={unreadDetourNotificationState}>
          <NotificationBellIcon />
        </NotificationsContext.Provider>
      </StateDispatchProvider>
    )
    expect(baseElement).toMatchSnapshot()
  })
})
