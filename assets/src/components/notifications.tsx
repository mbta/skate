import React, { useContext, useEffect, useState } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useCurrentTime from "../hooks/useCurrentTime"
import { Notification, NotificationId } from "../realtime.d"
import { setNotification } from "../state"
import { NotificationContent } from "./notificationContent"

export const Notifications = () => {
  const { notifications, removeNotification } = useContext(NotificationsContext)
  const currentTime = useCurrentTime()

  const [, dispatch] = useContext(StateDispatchContext)

  const openVPPForCurrentVehicle = (notification: Notification) => {
    dispatch(setNotification(notification))
  }

  return (
    <div className="m-notifications">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          remove={removeNotification}
          currentTime={currentTime}
          openVPPForCurrentVehicle={openVPPForCurrentVehicle}
        />
      ))}
    </div>
  )
}

export const NotificationCard = ({
  notification,
  remove,
  currentTime,
  openVPPForCurrentVehicle,
}: {
  notification: Notification
  remove: (id: NotificationId) => void
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
        onClick={() => remove(notification.id)}
      >
        Close
      </button>
    </div>
  )
}
