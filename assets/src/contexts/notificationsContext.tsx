import React, { createContext, ReactElement, useState } from "react"
import { useNotifications } from "../hooks/useNotifications"
import { Notification, NotificationId } from "../realtime.d"

export interface NotificationsStatus {
  notifications: Notification[]
  removeNotification: (notificationId: NotificationId) => void
}

export const NotificationsContext = createContext<NotificationsStatus>({
  notifications: [],
  // tslint:disable-next-line: no-empty
  removeNotification: () => {},
})

const deliveryFullstoryEvent = (numStacked: number): void => {
  if (window.FS && window.username) {
    window.FS.event("Notification delivered", {
      num_stacked_int: numStacked,
    })
  }
}

export const NotificationsProvider = ({
  children,
}: {
  children: ReactElement<HTMLElement>
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const addNotification = (notification: Notification): void => {
    setNotifications((previous) => {
      const newNotifications = [...previous, notification]
      deliveryFullstoryEvent(newNotifications.length)
      return newNotifications
    })
  }
  const removeNotification = (id: NotificationId): void => {
    setNotifications((previous) => previous.filter((n) => n.id !== id))
  }

  useNotifications(addNotification)

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        removeNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}
