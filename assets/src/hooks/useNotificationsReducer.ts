import { Socket } from "phoenix"
import {
  Dispatch as ReactDispatch,
  useContext,
  useEffect,
  useReducer,
} from "react"
import { putNotificationReadState } from "../api"
import { otherNotificationReadState } from "../contexts/notificationsContext"
import { SocketContext } from "../contexts/socketContext"
import { tagManagerEvent } from "../helpers/googleTagManager"
import { Notification } from "../realtime.d"
import { isChelseaBridgeNotification } from "../util/notifications"
import {
  InitialNotifications,
  NewNotification,
  ReceivedNotifications,
  useNotifications,
} from "./useNotifications"

export interface State {
  notifications: Notification[] | null
  showLatestNotification: boolean
}

export const initialState: State = {
  notifications: null,
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

interface SetNotificationsAction {
  type: "SET_NOTIFICATIONS"
  payload: {
    notifications: Notification[]
    isInitialLoad: boolean
  }
}

export const setNotifications = (
  notifications: Notification[],
  isInitialLoad: boolean
): SetNotificationsAction => ({
  type: "SET_NOTIFICATIONS",
  payload: { notifications, isInitialLoad },
})

interface ToggleReadStateAction {
  type: "TOGGLE_READ_STATE"
  payload: { notification: Notification }
}

export const toggleReadState = (
  notification: Notification
): ToggleReadStateAction => ({
  type: "TOGGLE_READ_STATE",
  payload: { notification },
})

export type Action =
  | AddNotificationAction
  | ExpireNotificationsAction
  | HideLatestNotificationAction
  | MarkAllAsReadAction
  | SetNotificationsAction
  | ToggleReadStateAction

export type Dispatch = ReactDispatch<Action>

type Reducer = (state: State, action: Action) => State

export const notificationsReducer = (
  notifications: Notification[] | null,
  action: Action
): Notification[] | null => {
  switch (action.type) {
    case "ADD_NOTIFICATION": {
      const newNotification = (action as AddNotificationAction).payload
        .notification
      return [newNotification, ...(notifications || [])]
    }
    case "EXPIRE_NOTIFICATIONS":
      return notifications
        ? notifications.filter((notification) => {
            const maxAgeInMs = 8 * 60 * 60 * 1000
            const now = (action as ExpireNotificationsAction).payload.now
            const ageInMs = now.valueOf() - notification.createdAt.valueOf()
            return ageInMs < maxAgeInMs
          })
        : null
    case "MARK_ALL_AS_READ":
      return notifications
        ? notifications.map((notification) => ({
            ...notification,
            state: "read",
          }))
        : null
    case "SET_NOTIFICATIONS": {
      return (action as SetNotificationsAction).payload.notifications
    }
    case "TOGGLE_READ_STATE": {
      const notificationToToggle = (action as ToggleReadStateAction).payload
        .notification
      return notifications
        ? notifications.map((notification) =>
            notification.id === notificationToToggle.id
              ? {
                  ...notification,
                  state: otherNotificationReadState(notification.state),
                }
              : notification
          )
        : null
    }

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
    case "SET_NOTIFICATIONS": {
      const { isInitialLoad, notifications } = (
        action as SetNotificationsAction
      ).payload

      if (isInitialLoad) {
        return (
          true && notifications.length > 0 && notifications[0].state !== "read"
        )
      }
      return showLatestNotification
    }
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

const persistMarkAllAsRead = (notifications: Notification[]): void => {
  const notificationIds = notifications.map((notification) => notification.id)
  putNotificationReadState("read", notificationIds)
}

const persistToggledNotificationReadState = (
  notification: Notification
): void => {
  putNotificationReadState(otherNotificationReadState(notification.state), [
    notification.id,
  ])
}

export const useNotificationsReducer = (
  isInitialLoad: boolean,
  setIsInitialLoad: React.Dispatch<boolean>
): [State, Dispatch] => {
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const [state, dispatch] = useReducer(reducer, initialState)

  const latestMessage: ReceivedNotifications = useNotifications(socket)

  useEffect(() => {
    if (latestMessage) {
      if (latestMessage.type === "initial" && isInitialLoad) {
        dispatch(
          setNotifications(
            (latestMessage as InitialNotifications).payload,
            isInitialLoad
          )
        )
        setIsInitialLoad(false)
      }

      if (latestMessage.type === "new") {
        tagManagerEvent("notification_delivered")
        if (isChelseaBridgeNotification(latestMessage.payload.reason)) {
          window.FS?.event("User was Delivered a Chelsea Bridge Notification")
        } else {
          window.FS?.event("User was Delivered a Notification")
        }
        dispatch(addNotification((latestMessage as NewNotification).payload))
      }
    }
  }, [socket, latestMessage, isInitialLoad, setIsInitialLoad])

  const dispatchWithSideEffects: Dispatch = (action: Action): void => {
    switch (action.type) {
      case "MARK_ALL_AS_READ":
        persistMarkAllAsRead(state.notifications || [])
        break
      case "TOGGLE_READ_STATE": {
        const notificationToToggle = (action as ToggleReadStateAction).payload
          .notification
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        persistToggledNotificationReadState(notificationToToggle!)
        break
      }
    }

    dispatch(action)
  }

  return [state, dispatchWithSideEffects]
}

export default useNotificationsReducer
