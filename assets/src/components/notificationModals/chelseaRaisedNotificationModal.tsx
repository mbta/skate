import React from "react"
import { Notification } from "../../realtime.d"
import { formattedTime } from "../../util/dateTime"
import BasicNotificationModal from "./basicNotificationModal"

const ChelseaRaisedNotificationModal = ({
  notification,
}: {
  notification: Notification
}) => {
  const contentString = (endDate: Date | null): string => {
    if (endDate)
      return (
        "OCC reported that the Chelsea St Bridge will be raised until " +
        formattedTime(endDate) +
        "."
      )
    else return "OCC reported that the Chelsea St Bridge has been raised."
  }

  return (
    <BasicNotificationModal
      title="Chelsea St Bridge Raised"
      body={contentString(notification.endTime)}
    />
  )
}

export default ChelseaRaisedNotificationModal
