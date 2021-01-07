import React from "react"
import { Notification, NotificationReason } from "../realtime.d"
import { formattedTimeDiffUnderThreshold } from "../util/dateTime"
import PropertiesList from "./propertiesList"

export const NotificationContent = ({
  notification,
  currentTime,
}: {
  notification: Notification
  currentTime: Date
}) => {
  return (
    <div className="m-notification-content">
      <div className="m-notification-content__title-row">
        <div className="m-notification-content__title">
          {title(notification.reason)}
        </div>
        <div className="m-notification-content__age">
          {formattedTimeDiffUnderThreshold(currentTime, notification.createdAt, 60)}
        </div>
      </div>
      <div className="m-notification-content__description">
        {description(notification)}
      </div>
      <PropertiesList
        properties={[
          {
            label: "Run",
            value: notification.runIds.join(", "),
          },
          {
            label: "Operator",
            value:
              notification.operatorName !== null &&
              notification.operatorId !== null
                ? `${notification.operatorName} #${notification.operatorId}`
                : null,
          },
        ]}
      />
    </div>
  )
}

export const title = (reason: NotificationReason): string => {
  switch (reason) {
    case "manpower":
      return "NO OPERATOR"
    case "diverted":
      return "DIVERSION"
    default:
      return reason.toUpperCase().replace("_", " ")
  }
}

const description = (notification: Notification): string => {
  const routeIds = notification.routeIds.join(", ")
  switch (notification.reason) {
    case "manpower":
      return `OCC reported that an operator is not available on the ${routeIds}.`
    case "disabled":
      return `OCC reported that a vehicle is disabled on the ${
        notification.routeIdAtCreation || routeIds
      }.`
    case "diverted":
      return `OCC reported that an operator has been diverted from the ${routeIds}.`
    case "accident":
      return `OCC reported that an operator has been in an accident on the ${
        notification.routeIdAtCreation || routeIds
      }.`
    case "adjusted":
      return `OCC reported an adjustment on the ${routeIds}.`
    case "operator_error":
      return `OCC reported an operator error on the ${
        notification.routeIdAtCreation || routeIds
      }.`
    case "traffic":
      return `OCC created a dispatcher note due to traffic on the ${
        notification.routeIdAtCreation || routeIds
      }.`
    case "other":
    default:
      return `OCC created a dispatcher note for the ${routeIds}.`
  }
}
