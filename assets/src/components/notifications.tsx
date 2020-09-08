import React, { useEffect, useState } from "react"
import useInterval from "../hooks/useInterval"
import { useNotifications } from "../hooks/useNotifications"
import featureIsEnabled from "../laboratoryFeatures"
import { Notification, NotificationReason } from "../realtime.d"
import { formattedTimeDiff, now } from "../util/dateTime"
import PropertiesList from "./propertiesList"

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const addNotification = (notification: Notification): void => {
    if (featureIsEnabled("notifications")) {
      setNotifications((previous) => [...previous, notification])
    }
  }
  const removeNotification = (id: number): void => {
    setNotifications((previous) => previous.filter((n) => n.id !== id))
  }
  useNotifications(addNotification)

  const [currentTime, setCurrentTime] = useState(now())
  useInterval(() => setCurrentTime(now()), 1000)

  return (
    <div className="m-notifications">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          remove={removeNotification}
          currentTime={currentTime}
        />
      ))}
    </div>
  )
}

export const NotificationCard = ({
  notification,
  remove,
  currentTime,
}: {
  notification: Notification
  remove: (id: number) => void
  currentTime: Date
}) => {
  const [isNew, setIsNew] = useState<boolean>(true)
  useEffect(() => {
    setTimeout(() => {
      setIsNew(false)
    }, 20)
  }, [])
  return (
    <div
      className={
        "m-notifications__card" + (isNew ? " m-notifications__card--new" : "")
      }
    >
      <button className="m-notifications__card-info">
        <div className="m-notification__title-row">
          <div className="m-notification__title">
            {title(notification.reason)}
          </div>
          <div className="m-notification__age">
            {formattedTimeDiff(currentTime, notification.createdAt)}
          </div>
        </div>
        <div className="m-notification__description">
          {description(notification)}
        </div>
        <PropertiesList
          properties={[
            {
              label: "Run",
              value: notification.runIds.join(", "),
            },
          ]}
        />
      </button>
      <button
        className="m-notifications__close"
        onClick={() => remove(notification.id)}
      >
        Close
      </button>
    </div>
  )
}

const title = (reason: NotificationReason): string => {
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
      return `OCC reported that a vehicle is disabled on the ${routeIds}.`
    case "diverted":
      return `OCC reported that an operator has been diverted from the ${routeIds}.`
    case "accident":
      return `OCC reported that an operator has been in an accident on the ${routeIds}.`
    case "adjusted":
      return `OCC reported an adjustment on the ${routeIds}.`
    case "operator_error":
      return `OCC reported an operator error on the ${routeIds}.`
    case "traffic":
      return `OCC created a dispatcher note due to traffic on the ${routeIds}.`
    case "other":
    default:
      return `OCC created a dispatcher note for the ${routeIds}.`
  }
}
