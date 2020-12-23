import {
  Notification,
  NotificationId,
  NotificationReason,
  NotificationState,
  RunId,
} from "../realtime.d"
import { RouteId, TripId } from "../schedule.d"
import { dateFromEpochSeconds } from "../util/dateTime"

export interface NotificationData {
  id: NotificationId
  created_at: number
  reason: NotificationReason
  route_ids: RouteId[]
  run_ids: RunId[]
  trip_ids: TripId[]
  operator_name: string | null
  operator_id: string | null
  route_id_at_creation: string | null
  start_time: number
  state: NotificationState
}

export const notificationFromData = (
  notificationData: NotificationData
): Notification => ({
  id: notificationData.id,
  createdAt: dateFromEpochSeconds(notificationData.created_at),
  reason: notificationData.reason,
  routeIds: notificationData.route_ids,
  runIds: notificationData.run_ids,
  tripIds: notificationData.trip_ids,
  operatorName: notificationData.operator_name,
  operatorId: notificationData.operator_id,
  routeIdAtCreation: notificationData.route_id_at_creation,
  startTime: new Date(notificationData.start_time),
  state: notificationData.state,
})
