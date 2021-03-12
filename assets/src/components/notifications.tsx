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
import { Notification, NotificationReason } from "../realtime.d"
import { NotificationContent } from "./notificationContent"

export const Notifications = () => {
  const { notifications, showLatestNotification, dispatch } = useContext(
    NotificationsContext
  )
  const currentTime = useCurrentTime()

  const [, stateDispatch] = useContext(StateDispatchContext)

  const notificationToShow =
    showLatestNotification && notifications.length > 0 ? notifications[0] : null

  useEffect(() => {
    if (notificationToShow && window.FS) {
      if (isChelseaBridgeReason(notificationToShow.reason)) {
        window.FS.event("Chelsea bridge notification delivered")
      }
    }
  }, [notificationToShow])

  const openVPPForCurrentVehicle = (notification: Notification) => {
    openVPPForNotification(notification, stateDispatch, dispatch)
  }

  return (
    <div className="m-notifications">
      {notificationToShow && (
        <NotificationCard
          notification={notificationToShow}
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
        onClick={() => {
          if (window && window.FS) {
            if (isChelseaBridgeReason(notification.reason)) {
              window.FS.event("Chelsea bridge notification clicked")
            }
          }
          openVPPForCurrentVehicle(notification)
          dispatch(hideLatestNotification())
        }}
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

export const isChelseaBridgeReason = (reason: NotificationReason): boolean => {
  const bridgeReasons: NotificationReason[] = [
    "chelsea_st_bridge_raised",
    "chelsea_st_bridge_lowered",
  ]
  return bridgeReasons.some((chelseaReason) => chelseaReason === reason)
}
