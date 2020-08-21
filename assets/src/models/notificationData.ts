import { Notification, NotificationReason, RunId } from "../realtime.d"
import { RouteId, TripId } from "../schedule.d"
import { dateFromEpochSeconds } from "../util/dateTime"

export interface NotificationData {
  created_at: number
  reason: NotificationReason
  route_ids: RouteId[]
  run_ids: RunId[]
  trip_ids: TripId[]
}

export const notificationsFromData = (
  notificationsData: NotificationData[]
): Notification[] => notificationsData.map(notificationFromData)

const notificationFromData = (
  notificationData: NotificationData,
  index: number
): Notification => ({
  id: Date.now() + index,
  createdAt: dateFromEpochSeconds(notificationData.created_at),
  reason: notificationData.reason,
  routeIds: notificationData.route_ids,
  runIds: notificationData.run_ids,
  tripIds: notificationData.trip_ids,
})
