import React, { useContext, useState } from "react"
import {
  NotificationsContext,
  otherNotificationReadState,
} from "../contexts/notificationsContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { ellipsisIcon } from "../helpers/icon"
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
  const { notifications, markAllAsRead } = useContext(NotificationsContext)
  const currentTime = useCurrentTime()

  const [, dispatch] = useContext(StateDispatchContext)

  const openVPPForCurrentVehicle = (notification: Notification) => {
    dispatch(setNotification(notification))
  }

  if (notifications.length === 0) {
    return <EmptyMessage />
  }

  const newNotifications = notifications.filter(
    (notification) => notification.state === "unread"
  )

  const readNotifications = notifications.filter(
    (notification) => notification.state === "read"
  )

  return (
    <div className="m-notification-drawer__cards">
      {newNotifications.length > 0 && (
        <NewNotifications
          notifications={newNotifications}
          currentTime={currentTime}
          openVPPForCurrentVehicle={openVPPForCurrentVehicle}
          markAllAsRead={markAllAsRead}
        />
      )}
      {readNotifications.length > 0 && (
        <ReadNotifications
          notifications={readNotifications}
          currentTime={currentTime}
          openVPPForCurrentVehicle={openVPPForCurrentVehicle}
        />
      )}
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

const NewNotifications = ({
  notifications,
  currentTime,
  openVPPForCurrentVehicle,
  markAllAsRead,
}: {
  notifications: Notification[]
  currentTime: Date
  openVPPForCurrentVehicle: (notification: Notification) => void
  markAllAsRead: () => void
}) => (
  <div className="m-notification-drawer__unread-section">
    <div className="m-notification-drawer__read-section-header">
      <span className="m-notification-drawer__n-unread">
        {notifications.length} new
      </span>
      <a
        className="m-notification-drawer__mark-all-read-link"
        onClick={markAllAsRead}
      >
        Mark as read
      </a>
    </div>
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

const ReadNotifications = ({
  notifications,
  currentTime,
  openVPPForCurrentVehicle,
}: {
  notifications: Notification[]
  currentTime: Date
  openVPPForCurrentVehicle: (notification: Notification) => void
}) => (
  <div className="m-notification-drawer__read-section">
    <div className="m-notification-drawer__unread-section-header">Read</div>
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

const EllipsisSubmenu = ({ notification }: { notification: Notification }) => {
  const { toggleNotificationState } = useContext(NotificationsContext)
  const otherReadState = otherNotificationReadState(notification.state)
  return (
    <div className="m-notification-drawer__submenu">
      <a
        onClick={(event) => {
          event.stopPropagation()
          toggleNotificationState(notification)
        }}
      >
        mark as {otherReadState}
      </a>
    </div>
  )
}

const NotificationCard = ({
  notification,
  currentTime,
  openVPPForCurrentVehicle,
}: {
  notification: Notification
  currentTime: Date
  openVPPForCurrentVehicle: (notification: Notification) => void
}) => {
  const [showSubmenu, setShowSubmenu] = useState<boolean>(false)
  const toggleShowSubmenu = () => setShowSubmenu(!showSubmenu)

  return (
    <button
      className={`m-notification-drawer__card m-notification-drawer__card--${notification.state}`}
      onClick={() => openVPPForCurrentVehicle(notification)}
    >
      <NotificationContent
        notification={notification}
        currentTime={currentTime}
      />
      {showSubmenu && <EllipsisSubmenu notification={notification} />}
      <a
        onClick={(event) => {
          event.stopPropagation()
          toggleShowSubmenu()
        }}
      >
        {ellipsisIcon("m-notification-drawer__submenu-icon")}
      </a>
    </button>
  )
}

export default NotificationDrawer
