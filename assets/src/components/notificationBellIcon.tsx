import React, { useContext } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { className } from "../helpers/dom"
import { NotificationBellIcon as NotificationBellIconSvg } from "../helpers/icon"
import { OpenView } from "../state"

const NotificationBellIcon = ({
  extraClasses,
}: {
  extraClasses?: string[]
}) => {
  const [{ openView }] = useContext(StateDispatchContext)
  const { notifications } = useContext(NotificationsContext)
  const unreadNotifications = notifications.filter(
    (notification) => notification.state === "unread"
  )
  const unreadBadge: boolean = unreadNotifications.length > 0

  return (
    <NotificationBellIconSvg
      className={className([
        "m-notification-bell-icon",
        openView === OpenView.NotificationDrawer
          ? "m-notification-bell-icon--open"
          : "m-notification-bell-icon--closed",
        unreadBadge
          ? "m-notification-bell-icon--unread"
          : "m-notification-bell-icon--read",
        ...(extraClasses || []),
      ])}
    />
  )
}

export default NotificationBellIcon
