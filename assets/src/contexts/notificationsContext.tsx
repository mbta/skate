import React, {
  createContext,
  Dispatch,
  ReactElement,
  SetStateAction,
  useEffect,
  useState,
} from "react"
import useCurrentTime from "../hooks/useCurrentTime"
import useInterval from "../hooks/useInterval"
import { useNotifications } from "../hooks/useNotifications"
import useNotificationsReducer, {
  Action,
  addNotification,
  expireNotifications,
  setNotifications,
  State as ReducerState,
} from "../hooks/useNotificationsReducer"
import { NotificationId, NotificationState } from "../realtime.d"

export const otherNotificationReadState = (state: NotificationState) => {
  if (state === "unread") {
    return "read"
  }
  if (state === "read") {
    return "unread"
  }
  return state
}

export interface State extends ReducerState {
  dispatch: (action: Action) => void
  rememberScrollPosition: (scrollPosition: number) => void
  scrollPosition: number
  notificationWithOpenSubmenuId: NotificationId | null
  setNotificationWithOpenSubmenuId: Dispatch<
    SetStateAction<NotificationId | null>
  >
}

// Don't worry about covering the no-ops below
/* istanbul ignore next */
export const NotificationsContext = createContext<State>({
  notifications: [],
  showLatestNotification: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  dispatch: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  rememberScrollPosition: () => {},
  scrollPosition: 0,
  notificationWithOpenSubmenuId: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setNotificationWithOpenSubmenuId: () => {},
})

export const NotificationsProvider = ({
  children,
}: {
  children: ReactElement<HTMLElement>
}) => {
  const [state, dispatch] = useNotificationsReducer()
  const { notifications, showLatestNotification } = state
  const [scrollPosition, setScrollPosition] = useState<number>(0)
  const now = useCurrentTime()

  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true)
  /* istanbul ignore next */
  useNotifications(
    (notification) => {
      dispatch(addNotification(notification))
    },
    (notificationsData) => {
      dispatch(setNotifications(notificationsData, isInitialLoad))
    }
  )
  useEffect(() => setIsInitialLoad(false))

  useInterval(() => dispatch(expireNotifications(now)), 10000)

  const [notificationWithOpenSubmenuId, setNotificationWithOpenSubmenuId] =
    useState<NotificationId | null>(null)

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        showLatestNotification,
        dispatch,
        rememberScrollPosition: setScrollPosition,
        scrollPosition,
        notificationWithOpenSubmenuId,
        setNotificationWithOpenSubmenuId,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}
