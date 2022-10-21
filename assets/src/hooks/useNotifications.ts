import { Socket } from "phoenix"
import {
  NotificationData,
  notificationFromData,
} from "../models/notificationData"
import { Notification } from "../realtime.d"
import { useChannel } from "./useChannel"

type InitialNotificationData = { initial_notifications: NotificationData[] }

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
  return useChannel<ReceivedNotifications>({
    socket,
    topic: "notifications",
    event: "notification",
    parser: parseNotifications,
    loadingState: null,
  })
}
