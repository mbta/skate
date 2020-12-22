import {
  markAllAsRead,
  reducer,
  setNotifications,
  toggleReadState,
} from "../../src/hooks/useNotificationsReducer"
import { NotificationData } from "../../src/models/notificationData"
import { Notification, NotificationState } from "../../src/realtime"

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
  state: "unread" as NotificationState,
}

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
})
