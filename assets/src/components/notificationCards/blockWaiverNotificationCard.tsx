import React from "react"
import {
  BlockWaiverNotification,
  Notification,
  BlockWaiverReason,
} from "../../realtime"
import { Route } from "../../schedule"
import { CardBody, CardProperties, CardReadable } from "../card"
import { useRoute, useRoutes } from "../../contexts/routesContext"

export const notificationTitle = (
  notification: Notification<BlockWaiverNotification>
): string => {
  const reason: BlockWaiverReason = notification.content.reason
  switch (reason) {
    case "manpower":
      return "No Operator"
    case "diverted":
      return "Diversion"
    default:
      return reason
        .replace("_", " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
  }
}

const notificationDescription = (
  notification: Notification<BlockWaiverNotification>,
  routes: Route[],
  routeAtCreation: Route | null
): string => {
  const routeNames = routes.map((route) => route.name).join(", ")
  const routeNameAtCreation = routeAtCreation
    ? routeAtCreation.name
    : notification.content.routeIdAtCreation

  switch (notification.content.reason) {
    case "manpower":
      return `OCC reported that an operator is not available on the ${routeNames}.`
    case "disabled":
      return `OCC reported that a vehicle is disabled on the ${
        routeNameAtCreation || routeNames
      }.`
    case "diverted":
      return `OCC reported that an operator has been diverted from the ${routeNames}.`
    case "accident":
      return `OCC reported that an operator has been in an accident on the ${
        routeNameAtCreation || routeNames
      }.`
    case "adjusted":
      return `OCC reported an adjustment on the ${routeNames}.`
    case "operator_error":
      return `OCC reported an operator error on the ${
        routeNameAtCreation || routeNames
      }.`
    case "traffic":
      return `OCC created a dispatcher note due to traffic on the ${
        routeNameAtCreation || routeNames
      }.`
    case "other":
    default:
      return `OCC created a dispatcher note for the ${routeNames}.`
  }
}

const BlockWaiverCardProperties = ({
  notification,
}: {
  notification: Notification<BlockWaiverNotification>
}) => (
  <CardProperties
    properties={[
      {
        label: "Run",
        value:
          notification.content.runIds.length > 0
            ? notification.content.runIds.join(", ")
            : null,
      },
      {
        label: "Operator",
        value:
          notification.content.operatorName !== null &&
          notification.content.operatorId !== null
            ? `${notification.content.operatorName} #${notification.content.operatorId}`
            : null,
        sensitive: true,
      },
    ]}
  />
)

export const BlockWaiverNotificationCard = ({
  notification,
  currentTime,
  unread,
  onClose,
  noFocusOrHover,
  onSelect,
  onRead,
}: {
  notification: Notification<BlockWaiverNotification>
  currentTime: Date
  unread: boolean
  onClose?: () => void
  noFocusOrHover?: boolean
  onSelect: (notification: Notification) => void
  onRead: (notification: Notification) => void
}) => {
  const routes = useRoutes(notification.content.routeIds)
  const routeAtCreation = useRoute(notification.content.routeIdAtCreation)

  return (
    <CardReadable
      currentTime={currentTime}
      title={notificationTitle(notification)}
      style="kiwi"
      isActive={unread}
      openCallback={() => {
        onSelect(notification)
        onRead(notification)

        if (onClose) {
          onClose()
        }
      }}
      closeCallback={onClose}
      time={notification.createdAt}
      noFocusOrHover={noFocusOrHover}
    >
      <CardBody>
        {notificationDescription(notification, routes, routeAtCreation)}
      </CardBody>
      <BlockWaiverCardProperties notification={notification} />
    </CardReadable>
  )
}
