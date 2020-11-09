import React, { useContext } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useCurrentTime from "../hooks/useCurrentTime"
import { Notification } from "../realtime.d"
import { closeNotificationDrawer, setNotification } from "../state"
import CloseButton from "./closeButton"
import NotificationBellIcon from "./notificationBellIcon"
import { NotificationContent } from "./notificationContent"

const NotificationDrawer = () => {
  return (
    <div className="m-notification-drawer">
      <TitleBar />
      <div className="m-notification-drawer__content">
        <Content />
      </div>
    </div>
  )
}

const TitleBar = () => {
  const [, dispatch] = useContext(StateDispatchContext)
  return (
    <div className="m-notification-drawer__title-bar">
      <NotificationBellIcon />
      <div className="m-notification-drawer__title">Notifications</div>
      <CloseButton
        onClick={() => {
          dispatch(closeNotificationDrawer())
        }}
      />
    </div>
  )
}

const Content = () => {
  const { notifications } = useContext(NotificationsContext)
  const currentTime = useCurrentTime()

  const [, dispatch] = useContext(StateDispatchContext)

  const openVPPForCurrentVehicle = (notification: Notification) => {
    dispatch(setNotification(notification))
  }

  if (notifications.length === 0) return <EmptyMessage />

  return (
    <div className="m-notification-drawer__cards">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          currentTime={currentTime}
          openVPPForCurrentVehicle={openVPPForCurrentVehicle}
        />
      ))}
    </div>
  )
}

const EmptyMessage = () => (
  <>
    <p>You have no notifications currently.</p>
    <p>
      Here you'll be notified about events like accidents and ghost vehicles on
      any bus routes you have selected on the Route Ladders page.
    </p>
  </>
)

const NotificationCard = ({
  notification,
  currentTime,
  openVPPForCurrentVehicle,
}: {
  notification: Notification
  currentTime: Date
  openVPPForCurrentVehicle: (notification: Notification) => void
}) => {
  return (
    <button
      className="m-notification-drawer__card"
      onClick={() => openVPPForCurrentVehicle(notification)}
    >
      <NotificationContent
        notification={notification}
        currentTime={currentTime}
      />
    </button>
  )
}

export default NotificationDrawer
