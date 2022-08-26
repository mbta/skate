import React from "react"
import { render } from "@testing-library/react"
import renderer from "react-test-renderer"
import routeFactory from "../factories/route"
import NotificationDrawer from "../../src/components/notificationDrawer"
import { NotificationsContext } from "../../src/contexts/notificationsContext"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import {
  markAllAsRead,
  toggleReadState,
} from "../../src/hooks/useNotificationsReducer"
import { Notification, NotificationState } from "../../src/realtime.d"
import { Route } from "../../src/schedule"
import {
  closeNotificationDrawer,
  initialState,
  setNotification,
} from "../../src/state"
import { now } from "../../src/util/dateTime"
import userEvent from "@testing-library/user-event"

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
  endTime: now(),
  state: "unread" as NotificationState,
}

const readNotification: Notification = {
  ...notification,
  id: "1",
  state: "read" as NotificationState,
}

const routes: Route[] = [
  routeFactory.build({
    id: "route1",
    name: "r1",
  }),
  routeFactory.build({
    id: "route2",
    name: "r2",
  }),
]

describe("NotificationDrawer", () => {
  test("renders empty state", () => {
    const tree = renderer.create(<NotificationDrawer />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("close button closes the drawer", async () => {
    const dispatch = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <RoutesProvider routes={routes}>
          <NotificationDrawer />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Close"))
    expect(dispatch).toHaveBeenCalledWith(closeNotificationDrawer())
  })

  test("renders notifications", () => {
    const tree = renderer
      .create(
        <RoutesProvider routes={routes}>
          <NotificationsContext.Provider
            value={{
              notifications: [notification],
              showLatestNotification: true,
              dispatch: jest.fn(),
              rememberScrollPosition: jest.fn(),
              scrollPosition: 0,
              notificationWithOpenSubmenuId: null,
              setNotificationWithOpenSubmenuId: jest.fn(),
            }}
          >
            <NotificationDrawer />
          </NotificationsContext.Provider>
        </RoutesProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("clicking a notification tries to open the VPP for it", async () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <RoutesProvider routes={routes}>
          <NotificationsContext.Provider
            value={{
              notifications: [notification],
              showLatestNotification: true,
              dispatch: jest.fn(),
              rememberScrollPosition: jest.fn(),
              scrollPosition: 0,
              notificationWithOpenSubmenuId: null,
              setNotificationWithOpenSubmenuId: jest.fn(),
            }}
          >
            <NotificationDrawer />
          </NotificationsContext.Provider>
        </RoutesProvider>
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByText(/No Operator/))
    expect(dispatch).toHaveBeenCalledWith(setNotification(notification))
  })

  test("clicking through an unread notification makes it read", async () => {
    const updatedNotification = {
      ...notification,
      tripIds: ["123", "456", "789"],
    }

    const mockNotificationsDispatch = jest.fn()

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn}>
        <RoutesProvider routes={routes}>
          <NotificationsContext.Provider
            value={{
              notifications: [updatedNotification],
              showLatestNotification: true,
              dispatch: mockNotificationsDispatch,
              rememberScrollPosition: jest.fn(),
              scrollPosition: 0,
              notificationWithOpenSubmenuId: null,
              setNotificationWithOpenSubmenuId: jest.fn(),
            }}
          >
            <NotificationDrawer />
          </NotificationsContext.Provider>
        </RoutesProvider>
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByText(/No Operator/))
    expect(mockNotificationsDispatch).toHaveBeenCalledWith(
      toggleReadState(updatedNotification)
    )
  })

  test("can make all read", async () => {
    const stateDispatch = jest.fn()
    const notificationsDispatch = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={stateDispatch}>
        <RoutesProvider routes={routes}>
          <NotificationsContext.Provider
            value={{
              notifications: [notification],
              showLatestNotification: true,
              dispatch: notificationsDispatch,
              rememberScrollPosition: jest.fn(),
              scrollPosition: 0,
              notificationWithOpenSubmenuId: null,
              setNotificationWithOpenSubmenuId: jest.fn(),
            }}
          >
            <NotificationDrawer />
          </NotificationsContext.Provider>
        </RoutesProvider>
      </StateDispatchProvider>
    )

    await user.click(result.getByText("Mark all as read"))
    expect(notificationsDispatch).toHaveBeenCalledWith(markAllAsRead())
  })

  test("no make all read link when there are no unread notifications", () => {
    const stateDispatch = jest.fn()
    const notificationsDispatch = jest.fn()

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={stateDispatch}>
        <RoutesProvider routes={routes}>
          <NotificationsContext.Provider
            value={{
              notifications: [readNotification],
              showLatestNotification: true,
              dispatch: notificationsDispatch,
              rememberScrollPosition: jest.fn(),
              scrollPosition: 0,
              notificationWithOpenSubmenuId: null,
              setNotificationWithOpenSubmenuId: jest.fn(),
            }}
          >
            <NotificationDrawer />
          </NotificationsContext.Provider>
        </RoutesProvider>
      </StateDispatchProvider>
    )

    expect(result.queryByText(/Mark all as read/)).toBeNull()
  })

  test("remembers the scroll position when the component is unmounted", () => {
    const rememberScrollPosition = jest.fn()

    const { unmount } = render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <RoutesProvider routes={routes}>
          <NotificationsContext.Provider
            value={{
              notifications: [notification],
              showLatestNotification: true,
              dispatch: jest.fn(),
              rememberScrollPosition,
              scrollPosition: 123,
              notificationWithOpenSubmenuId: null,
              setNotificationWithOpenSubmenuId: jest.fn(),
            }}
          >
            <NotificationDrawer />
          </NotificationsContext.Provider>
        </RoutesProvider>
      </StateDispatchProvider>
    )
    expect(rememberScrollPosition).not.toHaveBeenCalled()
    unmount()
    expect(rememberScrollPosition).toHaveBeenCalledWith(123)
  })
})
