import { useState } from "react"
import { useNotifications } from "../hooks/useNotifications"
import featureIsEnabled from "../laboratoryFeatures"
import { Notification } from "../realtime.d"

export const Notifications = () => {
  const [, setNotifications] = useState<Notification[]>([])
  const addNotification = (notification: Notification): void => {
    if (featureIsEnabled("notifications")) {
      setNotifications((previous) => [...previous, notification])
    }
  }
  useNotifications(addNotification)
  return null
}
