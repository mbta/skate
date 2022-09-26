import { Channel, Socket } from "phoenix"
import {
  Dispatch as ReactDispatch,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react"
import { putNotificationReadState } from "../api"
import { otherNotificationReadState } from "../contexts/notificationsContext"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { equalByElements } from "../helpers/array"
import { tagManagerEvent } from "../helpers/googleTagManager"
import { reload } from "../models/browser"
import {
  NotificationData,
  notificationFromData,
} from "../models/notificationData"
import { allOpenRouteIds } from "../models/routeTab"
import { Notification } from "../realtime.d"
import { RouteId } from "../schedule"

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

interface SetNotificationsAction {
  type: "SET_NOTIFICATIONS"
  payload: {
    notificationsData: NotificationData[]
    isInitialLoad: boolean
  }
}

export const setNotifications = (
  notificationsData: NotificationData[],
  isInitialLoad: boolean
): SetNotificationsAction => ({
  type: "SET_NOTIFICATIONS",
  payload: { notificationsData, isInitialLoad },
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
  notifications: Notification[],
  action: Action
): Notification[] => {
  switch (action.type) {
    case "ADD_NOTIFICATION": {
      const newNotification = (action as AddNotificationAction).payload
        .notification
      return [newNotification, ...notifications]
    }
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
    case "SET_NOTIFICATIONS": {
      const notificationsData = (action as SetNotificationsAction).payload
        .notificationsData
      return notificationsData.map(notificationFromData)
    }
    case "TOGGLE_READ_STATE": {
      const notificationToToggle = (action as ToggleReadStateAction).payload
        .notification
      return notifications.map((notification) =>
        notification.id === notificationToToggle.id
          ? {
              ...notification,
              state: otherNotificationReadState(notification.state),
            }
          : notification
      )
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
      const isInitialLoad = (action as SetNotificationsAction).payload
        .isInitialLoad
      if (isInitialLoad) {
        return true
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
  const topic = "notifications"
  const event = "notification"

  const [state, dispatch] = useReducer(reducer, initialState)

  const [{ routeTabs }] = useContext(StateDispatchContext)
  const [routeIds, setRouteIds] = useState<RouteId[]>(
    allOpenRouteIds(routeTabs)
  )

  const newRouteIds = allOpenRouteIds(routeTabs)

  if (!equalByElements(routeIds, newRouteIds)) {
    setRouteIds(newRouteIds)
  }

  useEffect(() => {
    let channel: Channel | undefined

    if (socket !== undefined) {
      channel = socket.channel(topic)
      channel.on(event, ({ data: data }) => {
        tagManagerEvent("notification_delivered")
        const notification: Notification = notificationFromData(data)
        dispatch(addNotification(notification))
      })
      const push = channel
        .join()
        .receive("error", ({ reason }) =>
          // eslint-disable-next-line no-console
          console.error(`joining topic ${topic} failed`, reason)
        )
        .receive("timeout", reload)

      if (isInitialLoad) {
        push.receive("ok", (data) => {
          if (data.initial_notifications) {
            dispatch(
              setNotifications(data.initial_notifications, isInitialLoad)
            )
            setIsInitialLoad(false)
          }
        })
      }
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [routeIds, socket, isInitialLoad, setIsInitialLoad])

  const dispatchWithSideEffects: Dispatch = (action: Action): void => {
    switch (action.type) {
      case "MARK_ALL_AS_READ":
        persistMarkAllAsRead(state.notifications)
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
