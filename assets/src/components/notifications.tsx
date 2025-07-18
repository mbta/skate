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

  const onRead = (notification: Notification) => {
    setNotificationReadState(notification, dispatch)
  }

  const onSelect = (notification: Notification) => {
    setNotificationSelectedState(notification, stateDispatch)
  }

  const onClose = () => dispatch(hideLatestNotification())

  return (
    <div className="c-notifications">
      {notificationToShow && (
        <NotificationCard
          notification={notificationToShow}
          currentTime={currentTime}
          onClose={onClose}
          onRead={onRead}
          onSelect={onSelect}
          noFocusOrHover={true}
        />
      )}
    </div>
  )
}

export const setNotificationReadState = (
  notification: Notification,
  notificationsDispatch: NotificationsDispatch
): void => {
  if (notification.state === "unread") {
    notificationsDispatch(toggleReadState(notification))
  }
}

export const setNotificationSelectedState = (
  notification: Notification,
  stateDispatch: StateDispatch
): void => {
  stateDispatch(setNotification(notification))
}
