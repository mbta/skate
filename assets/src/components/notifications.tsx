import React, { useContext, useEffect, useState } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useInterval from "../hooks/useInterval"
import { Notification, NotificationReason } from "../realtime.d"
import { setSelectedTripIdsForNotification } from "../state"
import { formattedTimeDiff, now } from "../util/dateTime"
import PropertiesList from "./propertiesList"

export const Notifications = () => {
  const { notifications, removeNotification } = useContext(NotificationsContext)
  const [currentTime, setCurrentTime] = useState(now())
  useInterval(() => setCurrentTime(now()), 1000)

  const [, dispatch] = useContext(StateDispatchContext)

  const openVPPForCurrentVehicle = (notification: Notification) => {
    dispatch(setSelectedTripIdsForNotification(notification.tripIds))
  }

  return (
    <div className="m-notifications">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          remove={removeNotification}
          currentTime={currentTime}
          openVPPForCurrentVehicle={openVPPForCurrentVehicle}
        />
      ))}
    </div>
  )
}

export const NotificationCard = ({
  notification,
  remove,
  currentTime,
  openVPPForCurrentVehicle,
}: {
  notification: Notification
  remove: (id: number) => void
  currentTime: Date
  openVPPForCurrentVehicle: (notification: Notification) => void
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
      <button
        className="m-notifications__card-info"
        onClick={() => openVPPForCurrentVehicle(notification)}
      >
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
