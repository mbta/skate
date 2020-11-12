import React, { useContext, useEffect, useState } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useCurrentTime from "../hooks/useCurrentTime"
import { Notification } from "../realtime.d"
import { setNotification } from "../state"
import { NotificationContent } from "./notificationContent"

export const Notifications = () => {
  const {
    notifications,
    showLatestNotification,
    hideNotification,
  } = useContext(NotificationsContext)
  const currentTime = useCurrentTime()

  const [, dispatch] = useContext(StateDispatchContext)

  const openVPPForCurrentVehicle = (notification: Notification) => {
    dispatch(setNotification(notification))
  }

  const latestNotificationIndex = notifications.length - 1

  return (
    <div className="m-notifications">
      {showLatestNotification && latestNotificationIndex >= 0 && (
        <NotificationCard
          key={notifications[latestNotificationIndex].id}
          notification={notifications[latestNotificationIndex]}
          hideNotification={hideNotification}
          currentTime={currentTime}
          openVPPForCurrentVehicle={openVPPForCurrentVehicle}
        />
      )}
    </div>
  )
}

export const NotificationCard = ({
  notification,
  hideNotification,
  currentTime,
  openVPPForCurrentVehicle,
}: {
  notification: Notification
  hideNotification: () => void
  currentTime: Date
  openVPPForCurrentVehicle: (notification: Notification) => void
}) => {
  const [isNew, setIsNew] = useState<boolean>(true)
  useEffect(() => {
    setTimeout(() => {
      setIsNew(false)
    }, 20)
  }, [])
  return (
    <div
      className={
        "m-notifications__card" + (isNew ? " m-notifications__card--new" : "")
      }
    >
      <button
        className="m-notifications__card-info"
        onClick={() => openVPPForCurrentVehicle(notification)}
      >
        <NotificationContent
          notification={notification}
          currentTime={currentTime}
        />
      </button>
      <button
        className="m-notifications__close"
        onClick={() => hideNotification()}
      >
        Hide
      </button>
    </div>
  )
}
