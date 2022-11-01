import {
  array,
  enums,
  Infer,
  nullable,
  number,
  type,
  string,
} from "superstruct"
import { Notification } from "../realtime.d"
import { dateFromEpochSeconds } from "../util/dateTime"

export const NotificationData = type({
  id: number(),
  created_at: number(),
  reason: enums([
    "manpower",
    "disabled",
    "diverted",
    "accident",
    "other",
    "adjusted",
    "operator_error",
    "traffic",
    "chelsea_st_bridge_raised",
    "chelsea_st_bridge_lowered",
  ]),
  route_ids: array(string()),
  run_ids: array(string()),
  trip_ids: array(string()),
  operator_name: nullable(string()),
  operator_id: nullable(string()),
  route_id_at_creation: nullable(string()),
  start_time: number(),
  end_time: nullable(number()),
  state: enums(["unread", "read", "deleted"]),
})
export type NotificationData = Infer<typeof NotificationData>

export const notificationFromData = (
  notificationData: NotificationData
): Notification => ({
  id: notificationData.id.toString(),
  createdAt: dateFromEpochSeconds(notificationData.created_at),
  reason: notificationData.reason,
  routeIds: notificationData.route_ids,
  runIds: notificationData.run_ids,
  tripIds: notificationData.trip_ids,
  operatorName: notificationData.operator_name,
  operatorId: notificationData.operator_id,
  routeIdAtCreation: notificationData.route_id_at_creation,
  startTime: new Date(notificationData.start_time * 1000),
  state: notificationData.state,
  endTime:
    notificationData.end_time === null
      ? null
      : new Date(notificationData.end_time * 1000),
})
