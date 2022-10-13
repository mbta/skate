import { act, renderHook } from "@testing-library/react"

import {
  hideLatestNotification,
  markAllAsRead,
  reducer,
  setNotifications,
  toggleReadState,
  useNotificationsReducer,
} from "../../src/hooks/useNotificationsReducer"
import { NotificationData } from "../../src/models/notificationData"
import { Notification, NotificationState } from "../../src/realtime"
import { mockUseReducerOnce } from "../testHelpers/mockHelpers"

const notification1: Notification = {
  id: "0",
  createdAt: new Date(0),
  reason: "manpower",
  routeIds: ["route1", "route2"],
  runIds: ["run1", "run2"],
  tripIds: [],
  operatorName: null,
  operatorId: null,
  routeIdAtCreation: null,
  startTime: new Date(0),
  endTime: new Date(100_000),
  state: "unread" as NotificationState,
}

const notification1Data: NotificationData = {
  id: "0",
  created_at: 0,
  reason: "manpower",
  route_ids: ["route1", "route2"],
  run_ids: ["run1", "run2"],
  trip_ids: [],
  operator_name: null,
  operator_id: null,
  route_id_at_creation: null,
  start_time: 0,
  end_time: 100,
  state: "unread",
}

const notification2: Notification = {
  id: "1",
  createdAt: new Date(1),
  reason: "accident",
  routeIds: ["route1", "route2"],
  runIds: ["run1", "run2"],
  tripIds: [],
  operatorName: null,
  operatorId: null,
  routeIdAtCreation: null,
  startTime: new Date(1),
  endTime: new Date(100),
  state: "unread" as NotificationState,
}

const expectPut = (url: string) =>
  expect(window.fetch).toHaveBeenCalledWith(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-csrf-token": "" },
  })

describe("notificationsReducer", () => {
  test("mark all as read sets all notification states and leaves show-latest alone", () => {
    const initialState = {
      notifications: [notification1, notification2],
      showLatestNotification: true,
    }
    const resultState = reducer(initialState, markAllAsRead())
    expect(
      resultState.notifications.map((notification) => notification.state)
    ).toEqual(["read", "read"])
    expect(resultState.showLatestNotification).toEqual(true)
  })

  test("set notifications on the initial page load and show the latest", () => {
    const initialState = {
      notifications: [],
      showLatestNotification: true,
    }
    const resultState = reducer(
      initialState,
      setNotifications([notification1Data], true)
    )
    expect(resultState.notifications).toEqual([notification1])
    expect(resultState.showLatestNotification).toEqual(true)
  })

  test("resetting notifications after the initial page load leaves the show-latest flag alone", () => {
    const initialState = {
      notifications: [],
      showLatestNotification: false,
    }
    const resultState = reducer(
      initialState,
      setNotifications([notification1Data], false)
    )
    expect(resultState.notifications).toEqual([notification1])
    expect(resultState.showLatestNotification).toEqual(false)
  })

  test("toggle read state affects just the one notification", () => {
    const initialState = {
      notifications: [notification1, notification2],
      showLatestNotification: true,
    }

    const resultState = reducer(initialState, toggleReadState(notification1))
    expect(resultState.notifications).toEqual([
      { ...notification1, state: "read" },
      notification2,
    ])
  })

  test("hiding read notification leaves notifications alone", () => {
    const initialState = {
      notifications: [notification1, notification2],
      showLatestNotification: true,
    }
    const resultState = reducer(initialState, hideLatestNotification())
    expect(resultState).toEqual({
      notifications: [notification1, notification2],
      showLatestNotification: false,
    })
  })
})

describe("useNotificationsReducer", () => {
  test("persists to server when mark all as read", () => {
    window.fetch = jest.fn()

    const initialState = {
      notifications: [notification1, notification2],
      showLatestNotification: true,
    }
    mockUseReducerOnce(reducer, initialState)

    const { result } = renderHook(() => useNotificationsReducer())

    const [, dispatch] = result.current

    act(() => {
      dispatch(markAllAsRead())
    })

    expectPut(
      "/api/notification_read_state?new_state=read&notification_ids=0,1"
    )
  })

  test("persists state toggle", () => {
    window.fetch = jest.fn()

    const initialState = {
      notifications: [notification1, notification2],
      showLatestNotification: true,
    }
    mockUseReducerOnce(reducer, initialState)

    const { result } = renderHook(() => useNotificationsReducer())

    const [, dispatch] = result.current

    act(() => {
      dispatch(toggleReadState(notification2))
    })

    expectPut("/api/notification_read_state?new_state=read&notification_ids=1")
  })
})
