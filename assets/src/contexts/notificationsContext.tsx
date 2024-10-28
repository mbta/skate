import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react"
import useCurrentTime from "../hooks/useCurrentTime"
import useInterval from "../hooks/useInterval"
import useNotificationsReducer, {
  Action,
  expireNotifications,
  State as ReducerState,
} from "../hooks/useNotificationsReducer"
import useSocket from "../hooks/useSocket"
import useVehicleForNotification from "../hooks/useVehicleForNotification"
import {
  isBlockWaiverNotification,
  NotificationId,
  NotificationState,
} from "../realtime"
import { selectVehicleFromNotification } from "../state/pagePanelState"
import { StateDispatchContext } from "./stateDispatchContext"

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

  dispatch: () => {},
  notificationWithOpenSubmenuId: null,

  setNotificationWithOpenSubmenuId: () => {},
})

export const NotificationsProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [{ selectedNotification }, stateDispatch] =
    useContext(StateDispatchContext)

  const now = useCurrentTime()

  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true)

  const [state, dispatch] = useNotificationsReducer(
    isInitialLoad,
    setIsInitialLoad
  )
  const { notifications, showLatestNotification } = state

  useInterval(() => dispatch(expireNotifications(now)), 10000)

  const [notificationWithOpenSubmenuId, setNotificationWithOpenSubmenuId] =
    useState<NotificationId | null>(null)

  const { socket } = useSocket()
  const vehicleForNotification = useVehicleForNotification(
    selectedNotification && isBlockWaiverNotification(selectedNotification)
      ? selectedNotification
      : undefined,
    socket
  )

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (selectedNotification) {
      stateDispatch(selectVehicleFromNotification(vehicleForNotification))
    }
  }, [selectedNotification, vehicleForNotification])
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        showLatestNotification,
        dispatch,
        notificationWithOpenSubmenuId,
        setNotificationWithOpenSubmenuId,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}
