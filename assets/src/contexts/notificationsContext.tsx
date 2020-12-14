import React, { createContext, ReactElement } from "react"
import useCurrentTime from "../hooks/useCurrentTime"
import useInterval from "../hooks/useInterval"
import { useNotifications } from "../hooks/useNotifications"
import useNotificationsReducer, {
  Action,
  addNotification,
  expireNotifications,
  State as ReducerState,
} from "../hooks/useNotificationsReducer"
import { NotificationState } from "../realtime.d"

export const otherNotificationReadState = (state: NotificationState) => {
  if (state === "unread") {
    return "read"
  }
  if (state === "read") {
    return "unread"
  }
  return state
}

interface State extends ReducerState {
  dispatch: (action: Action) => void
}

// Don't worry about covering the no-op below
/* istanbul ignore next */
export const NotificationsContext = createContext<State>({
  notifications: [],
  showLatestNotification: false,
  // tslint:disable-next-line: no-empty
  dispatch: () => {},
})

export const NotificationsProvider = ({
  children,
}: {
  children: ReactElement<HTMLElement>
}) => {
  const [state, dispatch] = useNotificationsReducer()
  const { notifications, showLatestNotification } = state

  const now = useCurrentTime()

  useNotifications((notification) => dispatch(addNotification(notification)))
  useInterval(() => dispatch(expireNotifications(now)), 10000)

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        showLatestNotification,
        dispatch,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}
