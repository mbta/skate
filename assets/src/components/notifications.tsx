import React, { useContext } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useCurrentTime from "../hooks/useCurrentTime"
import {
  Dispatch as NotificationsDispatch,
  hideLatestNotification,
  toggleReadState,
} from "../hooks/useNotificationsReducer"
import { Notification } from "../realtime"
import { Dispatch as StateDispatch, setNotification } from "../state"
import { NotificationCard } from "./notificationCard"

export const Notifications = () => {
  const { notifications, showLatestNotification, dispatch } =
    useContext(NotificationsContext)
  const currentTime = useCurrentTime()

  const [, stateDispatch] = useContext(StateDispatchContext)

  const notificationToShow =
    showLatestNotification && notifications && notifications.length > 0
      ? notifications[0]
      : null

  const openVPPForCurrentVehicle = (notification: Notification) => {
    openVPPForNotification(notification, stateDispatch, dispatch)
  }

  return (
    <div className="c-notifications">
      {notificationToShow && (
        <NotificationCard
          notification={notificationToShow}
          currentTime={currentTime}
          openVPPForCurrentVehicle={openVPPForCurrentVehicle}
          hideLatestNotification={() => dispatch(hideLatestNotification())}
          noFocusOrHover={true}
        />
      )}
    </div>
  )
}

export const openVPPForNotification = (
  notification: Notification,
  stateDispatch: StateDispatch,
  notificationsDispatch: NotificationsDispatch
): void => {
  if (notification.state === "unread") {
    notificationsDispatch(toggleReadState(notification))
  }
  stateDispatch(setNotification(notification))
}
