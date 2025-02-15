import React, { useContext } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import { joinClasses } from "../helpers/dom"
import { NotificationBellIcon as NotificationBellIconSvg } from "../helpers/icon"
import { OpenView } from "../state/pagePanelState"
import { usePanelStateFromStateDispatchContext } from "../hooks/usePanelState"
import inTestGroup, { TestGroups } from "../userInTestGroup"
import { NotificationType } from "../realtime"

const NotificationBellIcon = ({
  extraClasses,
}: {
  extraClasses?: string[]
}) => {
  const {
    currentView: { openView },
  } = usePanelStateFromStateDispatchContext()
  const { notifications } = useContext(NotificationsContext)

  const inDetoursNotificationGroup =
    inTestGroup(TestGroups.DetoursList) &&
    inTestGroup(TestGroups.DetoursNotifications)
  const unreadNotifications = (notifications || []).filter(
    (notification) =>
      notification.state === "unread" &&
      !(
        notification.content.$type === NotificationType.Detour &&
        !inDetoursNotificationGroup
      )
  )
  const unreadBadge: boolean = unreadNotifications.length > 0

  return (
    <NotificationBellIconSvg
      className={joinClasses([
        "c-notification-bell-icon",
        openView === OpenView.NotificationDrawer
          ? "c-notification-bell-icon--open"
          : "c-notification-bell-icon--closed",
        unreadBadge
          ? "c-notification-bell-icon--unread"
          : "c-notification-bell-icon--read",
        ...(extraClasses || []),
      ])}
    />
  )
}

export default NotificationBellIcon
