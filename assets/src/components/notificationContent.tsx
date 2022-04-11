import React from "react"
import { useRoute, useRoutes } from "../contexts/routesContext"
import { Notification, NotificationReason } from "../realtime.d"
import { Route } from "../schedule"
import {
  formattedTime,
  formattedTimeDiffUnderThreshold,
} from "../util/dateTime"
import PropertiesList from "./propertiesList"

export const NotificationContent = ({
  notification,
  currentTime,
}: {
  notification: Notification
  currentTime: Date
}) => {
  const routes = useRoutes(notification.routeIds)
  const routeAtCreation = useRoute(notification.routeIdAtCreation)
  return (
    <div className="m-notification-content">
      <div className="m-notification-content__title-row">
        <div className="m-notification-content__title">
          {title(notification.reason)}
        </div>
        <div className="m-notification-content__age">
          {formattedTimeDiffUnderThreshold(
            currentTime,
            notification.createdAt,
            60
          )}
        </div>
      </div>
      <div className="m-notification-content__description">
        {description(notification, routes, routeAtCreation)}
      </div>
      <PropertiesList
        properties={[
          {
            label: "Run",
            value:
              notification.runIds.length > 0
                ? notification.runIds.join(", ")
                : null,
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
    case "chelsea_st_bridge_raised":
      return "CHELSEA ST BRIDGE RAISED"
    case "chelsea_st_bridge_lowered":
      return "CHELSEA ST BRIDGE LOWERED"
    default:
      return reason.toUpperCase().replace("_", " ")
  }
}

const description = (
  notification: Notification,
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
    case "chelsea_st_bridge_raised":
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      return `OCC reported that the Chelsea St bridge will be raised until ${formattedTime(
        notification.endTime!
      )}.`
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
    case "chelsea_st_bridge_lowered":
      return "OCC reported that the Chelsea St bridge has been lowered."
    case "other":
    default:
      return `OCC created a dispatcher note for the ${routeNames}.`
  }
}
