import { Dispatch as ReactDispatch, useReducer } from "react"
import { otherNotificationReadState } from "../contexts/notificationsContext"
import { Notification, NotificationId } from "../realtime.d"

export interface State {
  notifications: Notification[]
  showLatestNotification: boolean
}

export const initialState: State = {
  notifications: [],
  showLatestNotification: false,
}

interface AddNotificationAction {
  type: "ADD_NOTIFICATION"
  payload: { notification: Notification }
}

export const addNotification = (
  notification: Notification
): AddNotificationAction => ({
  type: "ADD_NOTIFICATION",
  payload: { notification },
})

interface ExpireNotificationsAction {
  type: "EXPIRE_NOTIFICATIONS"
  payload: { now: Date }
}

export const expireNotifications = (now: Date): ExpireNotificationsAction => ({
  type: "EXPIRE_NOTIFICATIONS",
  payload: { now },
})

interface HideLatestNotificationAction {
  type: "HIDE_LATEST_NOTIFICATION"
}

export const hideLatestNotification = (): HideLatestNotificationAction => ({
  type: "HIDE_LATEST_NOTIFICATION",
})

interface MarkAllAsReadAction {
  type: "MARK_ALL_AS_READ"
}

export const markAllAsRead = (): MarkAllAsReadAction => ({
  type: "MARK_ALL_AS_READ",
})

interface ToggleReadStateAction {
  type: "TOGGLE_READ_STATE"
  payload: { notificationId: NotificationId }
}

export const toggleReadState = (
  notificationId: NotificationId
): ToggleReadStateAction => ({
  type: "TOGGLE_READ_STATE",
  payload: { notificationId },
})

export type Action =
  | AddNotificationAction
  | ExpireNotificationsAction
  | HideLatestNotificationAction
  | MarkAllAsReadAction
  | ToggleReadStateAction

export type Dispatch = ReactDispatch<Action>

type Reducer = (state: State, action: Action) => State

export const notificationsReducer = (
  notifications: Notification[],
  action: Action
): Notification[] => {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      const newNotification = (action as AddNotificationAction).payload
        .notification
      return [...notifications, newNotification]
    case "EXPIRE_NOTIFICATIONS":
      return notifications.filter((notification) => {
        const maxAgeInMs = 8 * 60 * 60 * 1000
        const now = (action as ExpireNotificationsAction).payload.now
        const ageInMs = now.valueOf() - notification.createdAt.valueOf()
        return ageInMs < maxAgeInMs
      })
    case "MARK_ALL_AS_READ":
      return notifications.map((notification) => ({
        ...notification,
        state: "read",
      }))
    case "TOGGLE_READ_STATE":
      const notificationIdToToggle = (action as ToggleReadStateAction).payload
        .notificationId
      return notifications.map((notification) =>
        notification.id === notificationIdToToggle
          ? {
              ...notification,
              state: otherNotificationReadState(notification.state),
            }
          : notification
      )

    default:
      return notifications
  }
}

const showLatestNotificationReducer = (
  showLatestNotification: boolean,
  action: Action
): boolean => {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      return true
    case "HIDE_LATEST_NOTIFICATION":
      return false
    default:
      return showLatestNotification
  }
}

export const reducer: Reducer = (state: State, action: Action): State => ({
  notifications: notificationsReducer(state.notifications, action),
  showLatestNotification: showLatestNotificationReducer(
    state.showLatestNotification,
    action
  ),
})

const deliverFullstoryEvent = (numStacked: number): void => {
  if (window.FS && window.username) {
    window.FS.event("Notification delivered", {
      num_stacked_int: numStacked,
    })
  }
}

export const useNotificationsReducer = (): [State, Dispatch] => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const dispatchWithSideEffects: Dispatch = (action: Action): void => {
    switch (action.type) {
      case "ADD_NOTIFICATION":
        deliverFullstoryEvent(state.notifications.length + 1)
    }

    dispatch(action)
  }

  return [state, dispatchWithSideEffects]
}

export default useNotificationsReducer
