import { Socket } from "phoenix"
import { array, Infer, object, union } from "superstruct"
import {
  NotificationData,
  notificationFromData,
} from "../models/notificationData"
import { Notification } from "../realtime.d"
import { useCheckedChannel } from "./useChannel"

const InitialNotificationData = object({
  initial_notifications: array(NotificationData),
})
type InitialNotificationData = Infer<typeof InitialNotificationData>

const ReceivedNotificationsData = union([
  NotificationData,
  InitialNotificationData,
])

export type InitialNotifications = { type: "initial"; payload: Notification[] }
export type NewNotification = { type: "new"; payload: Notification }

export type ReceivedNotifications =
  | NewNotification
  | InitialNotifications
  | null

const parseNotifications = (
  notificationData: NotificationData | InitialNotificationData
): NewNotification | InitialNotifications => {
  if ("initial_notifications" in notificationData) {
    return {
      type: "initial",
      payload: (
        notificationData as InitialNotificationData
      ).initial_notifications.map(notificationFromData),
    }
  }
  return {
    type: "new",
    payload: notificationFromData(notificationData as NotificationData),
  }
}

export const useNotifications = (socket: Socket | undefined) => {
  return useCheckedChannel<
    NotificationData | InitialNotificationData,
    ReceivedNotifications
  >({
    socket,
    topic: "notifications",
    event: "notification",
    dataStruct: ReceivedNotificationsData,
    parser: parseNotifications,
    loadingState: null,
  })
}
