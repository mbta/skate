import React, { ReactElement } from "react"
import { useRoute, useRoutes } from "../contexts/routesContext"
import {
  BlockWaiverNotification,
  Notification,
  BlockWaiverReason,
  NotificationType,
  isBlockWaiverNotification,
} from "../realtime"
import { Route } from "../schedule"
import { formattedTime } from "../util/dateTime"
import { CardBody, CardProperties, CardReadable } from "./card"
import { fullStoryEvent } from "../helpers/fullStory"

export const NotificationCard = ({
  notification,
  currentTime,
  openVPPForCurrentVehicle,
  hideLatestNotification,
  noFocusOrHover,
}: {
  notification: Notification
  currentTime: Date
  openVPPForCurrentVehicle: (notification: Notification) => void
  hideLatestNotification?: () => void
  noFocusOrHover?: boolean
}): ReactElement<HTMLElement> => {
  const routes = useRoutes(
    isBlockWaiverNotification(notification) ? notification.content.routeIds : []
  )
  const routeAtCreation = useRoute(
    isBlockWaiverNotification(notification)
      ? notification.content.routeIdAtCreation
      : null
  )
  const isUnread = notification.state === "unread"
  return (
    <CardReadable
      currentTime={currentTime}
      title={<>{title(notification)}</>}
      style="kiwi"
      isActive={isUnread}
      openCallback={() => {
        openVPPForCurrentVehicle(notification)

        if (hideLatestNotification) {
          hideLatestNotification()
        }

        if (notification.content.$type === NotificationType.BridgeMovement) {
          fullStoryEvent("User clicked Chelsea Bridge Notification", {})
        }
      }}
      closeCallback={hideLatestNotification}
      time={notification.createdAt}
      noFocusOrHover={noFocusOrHover}
    >
      <CardBody>{description(notification, routes, routeAtCreation)}</CardBody>
      {isBlockWaiverNotification(notification) && (
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
      )}
    </CardReadable>
  )
}

export const title = (notification: Notification) => {
  switch (notification.content.$type) {
    case NotificationType.BlockWaiver: {
      return blockWaiverNotificationTitle(notification.content.reason)
    }
    case NotificationType.BridgeMovement: {
      switch (notification.content.status) {
        case "lowered":
          return "Chelsea St Bridge Lowered"
        case "raised":
          return "Chelsea St Bridge Raised"
      }
    }
  }
}
export const blockWaiverNotificationTitle = (
  reason: BlockWaiverReason
): string => {
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
const blockWaiverDescription = (
  notification: BlockWaiverNotification,
  routes: Route[],
  routeAtCreation: Route | null
): string => {
  const routeNames = routes.map((route) => route.name).join(", ")
  const routeNameAtCreation = routeAtCreation
    ? routeAtCreation.name
    : notification.routeIdAtCreation

  switch (notification.reason) {
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

const description = (
  notification: Notification,
  routes: Route[],
  routeAtCreation: Route | null
): string => {
  switch (notification.content.$type) {
    case NotificationType.BlockWaiver: {
      return blockWaiverDescription(
        notification.content,
        routes,
        routeAtCreation
      )
    }
    case NotificationType.BridgeMovement: {
      switch (notification.content.status) {
        case "raised":
          return `OCC reported that the Chelsea St bridge will be raised until ${formattedTime(
            notification.content.loweringTime
          )}.`

        case "lowered":
          return "OCC reported that the Chelsea St bridge has been lowered."
      }
    }
  }
}
