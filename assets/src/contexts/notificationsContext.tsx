import React, { createContext, ReactElement, useState } from "react"
import { useNotifications } from "../hooks/useNotifications"
import { Notification } from "../realtime.d"

export interface NotificationsStatus {
  notifications: Notification[]
  showLatestNotification: boolean
  hide: () => void
}

// Codecov gets in a snit about not covering the "hide" no-op below.
/* istanbul ignore next */

export const NotificationsContext = createContext<NotificationsStatus>({
  notifications: [],
  showLatestNotification: false,
  // tslint:disable-next-line: no-empty
  hide: () => {},
})

const deliverFullstoryEvent = (numStacked: number): void => {
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
  const [showLatestNotification, setShowLatestNotification] = useState<boolean>(
    false
  )
  const addNotification = (notification: Notification): void => {
    setNotifications((previous) => {
      const newNotifications = [...previous, notification]
      deliverFullstoryEvent(newNotifications.length)
      return newNotifications
    })

    setShowLatestNotification(true)
  }

  const hide = () => setShowLatestNotification(false)

  useNotifications(addNotification)

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        showLatestNotification,
        hide,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}
