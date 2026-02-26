import {
  array,
  enums,
  Infer,
  nullable,
  number,
  type,
  string,
  literal,
  union,
  coerce,
  date,
} from "superstruct"

import {
  BlockWaiverNotification,
  BridgeNotification,
  DetourNotificationStatus,
  Notification,
  NotificationContentTypes,
  NotificationType,
} from "../realtime"
import { detourId } from "./detoursList"
import inTestGroup, { TestGroups } from "../userInTestGroup"

const dateFromSeconds = coerce(
  date(),
  number(),
  (value) => new Date(value * 1000)
)

export const BlockWaiverNotificationData = type({
  __struct__: literal(NotificationType.BlockWaiver),
  reason: enums([
    "manpower",
    "disabled",
    "diverted",
    "accident",
    "other",
    "adjusted",
    "operator_error",
    "traffic",
  ]),
  created_at: dateFromSeconds,
  route_ids: array(string()),
  run_ids: array(string()),
  trip_ids: array(string()),
  operator_name: nullable(string()),
  operator_id: nullable(string()),
  route_id_at_creation: nullable(string()),
  start_time: dateFromSeconds,
  end_time: nullable(dateFromSeconds),
})

export type BlockWaiverNotificationData = Infer<
  typeof BlockWaiverNotificationData
>

export const BridgeNotificationData = union([
  type({
    __struct__: literal(NotificationType.BridgeMovement),
    status: literal("raised"),
    lowering_time: dateFromSeconds,
  }),
  type({
    __struct__: literal(NotificationType.BridgeMovement),
    status: literal("lowered"),
  }),
])

export const DetourNotificationData = type({
  __struct__: literal(NotificationType.Detour),
  status: enums([
    DetourNotificationStatus.Activated,
    DetourNotificationStatus.Deactivated,
    DetourNotificationStatus.Updated,
  ]),
  detour_id: detourId,
  headsign: string(),
  route: string(),
  direction: string(),
  origin: string(),
})

export const DetourExpirationNotificationData = type({
  __struct__: literal(NotificationType.DetourExpiration),
  estimated_duration: string(),
  expires_in: enums([0, 30]),
  detour_id: detourId,
  headsign: string(),
  route: string(),
  direction: string(),
  origin: string(),
})

export type DetourNotificationData = Infer<typeof DetourNotificationData>

export const NotificationData = type({
  id: coerce(string(), number(), (i) => i.toString()),
  created_at: dateFromSeconds,
  state: enums(["unread", "read", "deleted"]),
  // Requires a field named `__struct__` to be present as the discriminator
  content: union([
    BridgeNotificationData,
    BlockWaiverNotificationData,
    DetourNotificationData,
    DetourExpirationNotificationData,
  ]),
})
export type NotificationData = Infer<typeof NotificationData>

export const notificationFromData = (
  notificationData: NotificationData
): Notification => {
  let content: NotificationContentTypes

  switch (notificationData.content.__struct__) {
    case NotificationType.BlockWaiver: {
      content = {
        $type: NotificationType.BlockWaiver,
        reason: notificationData.content.reason,
        createdAt: notificationData.content.created_at,
        routeIds: notificationData.content.route_ids,
        runIds: notificationData.content.run_ids,
        tripIds: notificationData.content.trip_ids,
        operatorName: notificationData.content.operator_name,
        operatorId: notificationData.content.operator_id,
        routeIdAtCreation: notificationData.content.route_id_at_creation,
        startTime: notificationData.content.start_time,
        endTime: notificationData.content.end_time,
      } satisfies BlockWaiverNotification
      break
    }
    case NotificationType.BridgeMovement: {
      switch (notificationData.content.status) {
        case "lowered": {
          content = {
            $type: NotificationType.BridgeMovement,
            status: "lowered",
          }
          break
        }
        case "raised": {
          content = {
            $type: NotificationType.BridgeMovement,
            status: notificationData.content.status,
            loweringTime: notificationData.content.lowering_time,
          } satisfies BridgeNotification
          break
        }
      }
      break
    }

    case NotificationType.Detour: {
      content = {
        $type: NotificationType.Detour,
        status: notificationData.content.status,
        detourId: notificationData.content.detour_id,
        direction: notificationData.content.direction,
        headsign: notificationData.content.headsign,
        origin: notificationData.content.origin,
        route: notificationData.content.route,
      }
      break
    }

    case NotificationType.DetourExpiration: {
      content = {
        $type: NotificationType.DetourExpiration,
        detourId: notificationData.content.detour_id,

        estimatedDuration: notificationData.content.estimated_duration,
        expiresIn: notificationData.content.expires_in,

        headsign: notificationData.content.headsign,
        route: notificationData.content.route,
        direction: notificationData.content.direction,
        origin: notificationData.content.origin,

        isDispatcher: inTestGroup(TestGroups.DetoursPilot),
      }
    }
  }

  return {
    id: notificationData.id,
    state: notificationData.state,
    createdAt: notificationData.created_at,
    content,
  }
}
