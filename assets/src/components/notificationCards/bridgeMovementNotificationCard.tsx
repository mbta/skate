import React from "react"
import { Notification } from "../../realtime"
import { formattedTime } from "../../util/dateTime"
import { CardBody, CardReadable } from "../card"
import { fullStoryEvent } from "../../helpers/fullStory"
import { BridgeNotification } from "../../realtime"

export const notificationTitle = (
  notification: Notification<BridgeNotification>
) => {
  switch (notification.content.status) {
    case "lowered":
      return "Chelsea St Bridge Lowered"
    case "raised":
      return "Chelsea St Bridge Raised"
  }
}

const notificationDescription = (
  notification: Notification<BridgeNotification>
) => {
  switch (notification.content.status) {
    case "raised":
      return `OCC reported that the Chelsea St bridge will be raised until ${formattedTime(
        notification.content.loweringTime
      )}.`

    case "lowered":
      return "OCC reported that the Chelsea St bridge has been lowered."
  }
}

export const BridgeMovementNotificationCard = ({
  notification,
  currentTime,
  unread,
  hideLatestNotification,
  noFocusOrHover,
  onSelect,
  onRead,
}: {
  notification: Notification<BridgeNotification>
  currentTime: Date
  unread: boolean
  hideLatestNotification?: () => void
  noFocusOrHover?: boolean
  onSelect: (notification: Notification) => void
  onRead: (notification: Notification) => void
}) => {
  return (
    <CardReadable
      currentTime={currentTime}
      title={notificationTitle(notification)}
      style="kiwi"
      isActive={unread}
      openCallback={() => {
        onSelect(notification)
        onRead(notification)

        if (hideLatestNotification) {
          hideLatestNotification()
        }

        fullStoryEvent("User clicked Chelsea Bridge Notification", {})
      }}
      closeCallback={hideLatestNotification}
      time={notification.createdAt}
      noFocusOrHover={noFocusOrHover}
    >
      <CardBody>{notificationDescription(notification)}</CardBody>
    </CardReadable>
  )
}
