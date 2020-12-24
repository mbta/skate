import React, { useContext, useEffect, useState } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import {
  openVPPForNotification,
  StateDispatchContext,
} from "../contexts/stateDispatchContext"
import useCurrentTime from "../hooks/useCurrentTime"
import {
  Dispatch,
  hideLatestNotification,
} from "../hooks/useNotificationsReducer"
import { Notification } from "../realtime.d"
import { NotificationContent } from "./notificationContent"

export const Notifications = () => {
  const { notifications, showLatestNotification, dispatch } = useContext(
    NotificationsContext
  )
  const currentTime = useCurrentTime()

  const [, stateDispatch] = useContext(StateDispatchContext)

  const openVPPForCurrentVehicle = (notification: Notification) => {
    openVPPForNotification(notification, stateDispatch, dispatch)
  }

  return (
    <div className="m-notifications">
      {showLatestNotification && notifications.length > 0 && (
        <NotificationCard
          notification={notifications[0]}
          dispatch={dispatch}
          currentTime={currentTime}
          openVPPForCurrentVehicle={openVPPForCurrentVehicle}
        />
      )}
    </div>
  )
}

export const NotificationCard = ({
  notification,
  dispatch,
  currentTime,
  openVPPForCurrentVehicle,
}: {
  notification: Notification
  dispatch: Dispatch
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
        onClick={() => dispatch(hideLatestNotification())}
      >
        Hide
      </button>
    </div>
  )
}
