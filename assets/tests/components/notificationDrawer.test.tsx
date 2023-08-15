import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
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
  closeView,
  initialState,
  rememberNotificationDrawerScrollPosition,
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
  test("renders loading state", () => {
    render(
      <NotificationsContext.Provider
        value={{
          notifications: null,
          showLatestNotification: false,
          dispatch: jest.fn(),
          notificationWithOpenSubmenuId: null,
          setNotificationWithOpenSubmenuId: jest.fn(),
        }}
      >
        <NotificationDrawer />
      </NotificationsContext.Provider>
    )
    expect(screen.getByText(/loading/)).toBeInTheDocument()
  })
  test("renders empty state", () => {
    const result = render(
      <NotificationsContext.Provider
        value={{
          notifications: [],
          showLatestNotification: true,
          dispatch: jest.fn(),
          notificationWithOpenSubmenuId: null,
          setNotificationWithOpenSubmenuId: jest.fn(),
        }}
      >
        <NotificationDrawer />
      </NotificationsContext.Provider>
    )
    expect(result.asFragment()).toMatchSnapshot()
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

    await user.click(result.getByRole("button", { name: /close/i }))
    expect(dispatch).toHaveBeenCalledWith(closeView())
  })

  test("renders notifications", () => {
    const result = render(
      <RoutesProvider routes={routes}>
        <NotificationsContext.Provider
          value={{
            notifications: [notification],
            showLatestNotification: true,
            dispatch: jest.fn(),
            notificationWithOpenSubmenuId: null,
            setNotificationWithOpenSubmenuId: jest.fn(),
          }}
        >
          <NotificationDrawer />
        </NotificationsContext.Provider>
      </RoutesProvider>
    )

    expect(result.asFragment()).toMatchSnapshot()
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
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <RoutesProvider routes={routes}>
          <NotificationsContext.Provider
            value={{
              notifications: [updatedNotification],
              showLatestNotification: true,
              dispatch: mockNotificationsDispatch,
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
    const dispatch = jest.fn()

    const { unmount } = render(
      <StateDispatchProvider
        state={{ ...initialState, notificationDrawerScrollPosition: 123 }}
        dispatch={dispatch}
      >
        <RoutesProvider routes={routes}>
          <NotificationsContext.Provider
            value={{
              notifications: [notification],
              showLatestNotification: true,
              dispatch: jest.fn(),
              notificationWithOpenSubmenuId: null,
              setNotificationWithOpenSubmenuId: jest.fn(),
            }}
          >
            <NotificationDrawer />
          </NotificationsContext.Provider>
        </RoutesProvider>
      </StateDispatchProvider>
    )
    // first call to rememberScrollPosition happens on initial render, it's the second one
    // that happens on unmount
    expect(dispatch).not.toHaveBeenNthCalledWith(
      2,
      rememberNotificationDrawerScrollPosition(123)
    )
    unmount()
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      rememberNotificationDrawerScrollPosition(123)
    )
  })
})
