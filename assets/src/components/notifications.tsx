import { useState } from "react"
import { useNotifications } from "../hooks/useNotifications"
import { Notification } from "../realtime.d"

export const Notifications = () => {
  const [, setNotifications] = useState<Notification[]>([])
  const addNotification = (notification: Notification): void => {
    // tslint:disable-next-line
    console.log(notification)
    setNotifications((previous) => [...previous, notification])
  }
  useNotifications(addNotification)
  return null
}
