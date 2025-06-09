import React from "react"
import {
  Notification,
  isBlockWaiverNotification,
  isADetourNotification,
  isBridgeNotification,
} from "../realtime"
import inTestGroup, { TestGroups } from "../userInTestGroup"
import { BlockWaiverNotificationCard } from "./notificationCards/blockWaiverNotificationCard"
import { BridgeMovementNotificationCard } from "./notificationCards/bridgeMovementNotificationCard"
import { DetourNotificationCard } from "./notificationCards/detourNotificationCard"

interface NotificationCardProps {
  notification: Notification
  currentTime: Date
  setNotificationRead: (notification: Notification) => void
  setNotificationSelected: (notification: Notification) => void
  hideLatestNotification?: () => void
  noFocusOrHover?: boolean
}

export const NotificationCard = (props: NotificationCardProps) => {
  const {
    notification,
    currentTime,
    setNotificationRead,
    setNotificationSelected,
    hideLatestNotification,
    noFocusOrHover,
  } = props
  const isBlockWaiver = isBlockWaiverNotification(notification)
  const isDetour = isADetourNotification(notification)
  const isBridge = isBridgeNotification(notification)

  if (
    isDetour &&
    !(
      inTestGroup(TestGroups.DetoursList) &&
      inTestGroup(TestGroups.DetoursNotifications)
    )
  ) {
    return null
  }

  const isUnread = notification.state === "unread"
  const setNotificationState = (notification: Notification) => {
    setNotificationSelected(notification)
    setNotificationRead(notification)
  }

  if (isBlockWaiver) {
    return (
      <BlockWaiverNotificationCard
        notification={notification}
        currentTime={currentTime}
        isUnread={isUnread}
        setNotificationState={setNotificationState}
        hideLatestNotification={hideLatestNotification}
        noFocusOrHover={noFocusOrHover}
      />
    )
  }

  if (isBridge) {
    return (
      <BridgeMovementNotificationCard
        notification={notification}
        currentTime={currentTime}
        isUnread={isUnread}
        setNotificationState={setNotificationState}
        hideLatestNotification={hideLatestNotification}
        noFocusOrHover={noFocusOrHover}
      />
    )
  }

  if (isDetour) {
    return (
      <DetourNotificationCard
        notification={notification}
        currentTime={currentTime}
        isUnread={isUnread}
        setNotificationRead={setNotificationRead}
        hideLatestNotification={hideLatestNotification}
        noFocusOrHover={noFocusOrHover}
      />
    )
  }

  return null
}
