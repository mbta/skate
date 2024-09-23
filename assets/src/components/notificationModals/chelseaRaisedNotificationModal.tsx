import React from "react"
import { BridgeRaisedNotification } from "../../realtime"
import { formattedTime } from "../../util/dateTime"
import BasicNotificationModal from "./basicNotificationModal"

const ChelseaRaisedNotificationModal = ({
  notification,
}: {
  notification: BridgeRaisedNotification
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
      body={contentString(notification.loweringTime)}
    />
  )
}

export default ChelseaRaisedNotificationModal
