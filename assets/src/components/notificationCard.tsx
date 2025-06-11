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
  onRead: (notification: Notification) => void
  onSelect: (notification: Notification) => void
  onClose?: () => void
  noFocusOrHover?: boolean
}

export const NotificationCard = (props: NotificationCardProps) => {
  const {
    notification,
    currentTime,
    onRead,
    onSelect,
    onClose,
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

  const unread = notification.state === "unread"

  if (isBlockWaiver) {
    return (
      <BlockWaiverNotificationCard
        notification={notification}
        currentTime={currentTime}
        unread={unread}
        onRead={onRead}
        onSelect={onSelect}
        onClose={onClose}
        noFocusOrHover={noFocusOrHover}
      />
    )
  }

  if (isBridge) {
    return (
      <BridgeMovementNotificationCard
        notification={notification}
        currentTime={currentTime}
        unread={unread}
        onRead={onRead}
        onSelect={onSelect}
        onClose={onClose}
        noFocusOrHover={noFocusOrHover}
      />
    )
  }

  if (isDetour) {
    return (
      <DetourNotificationCard
        notification={notification}
        currentTime={currentTime}
        unread={unread}
        onRead={onRead}
        onClose={onClose}
        noFocusOrHover={noFocusOrHover}
      />
    )
  }

  return null
}
