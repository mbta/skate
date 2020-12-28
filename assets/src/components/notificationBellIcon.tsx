import { useContext } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { className } from "../helpers/dom"
import { notificationBellIcon } from "../helpers/icon"

const NotificationBellIcon = ({
  extraClasses,
}: {
  extraClasses?: string[]
}) => {
  const [{ notificationDrawerIsOpen }] = useContext(StateDispatchContext)
  const { notifications } = useContext(NotificationsContext)
  const unreadNotifications = notifications.filter(
    (notification) => notification.state === "unread"
  )
  const unreadBadge: boolean = unreadNotifications.length > 0

  return notificationBellIcon(
    className([
      "m-notification-bell-icon",
      notificationDrawerIsOpen
        ? "m-notification-bell-icon--open"
        : "m-notification-bell-icon--closed",
      unreadBadge
        ? "m-notification-bell-icon--unread"
        : "m-notification-bell-icon--read",
      ...(extraClasses || []),
    ])
  )
}

export default NotificationBellIcon
