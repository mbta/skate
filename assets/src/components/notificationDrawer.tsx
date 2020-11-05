import React, { useContext } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { closeNotificationDrawer } from "../state"
import CloseButton from "./closeButton"
import NotificationBellIcon from "./notificationBellIcon"

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

  if (notifications.length === 0) return <EmptyMessage />

  return (
    <div className="m-notification-drawer__cards">
      {notifications.map((notification) => (
        <div key={notification.id}>{notification.reason}</div>
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

export default NotificationDrawer
