import React, { createContext, ReactElement, useState } from "react"
import useCurrentTime from "../hooks/useCurrentTime"
import useInterval from "../hooks/useInterval"
import { useNotifications } from "../hooks/useNotifications"
import { Notification } from "../realtime.d"

export interface NotificationsStatus {
  notifications: Notification[]
  showLatestNotification: boolean
  hideNotification: () => void
}

// Codecov gets in a snit about not covering the "hide" no-op below.
/* istanbul ignore next */

export const NotificationsContext = createContext<NotificationsStatus>({
  notifications: [],
  showLatestNotification: false,
  // tslint:disable-next-line: no-empty
  hideNotification: () => {},
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

  const hideNotification = () => setShowLatestNotification(false)

  const now = useCurrentTime()

  const expireOldNotifications = () => {
    const maxAgeInMs = 8 * 60 * 60 * 1000
    setNotifications((previous) => {
      return previous.filter((notification) => {
        const ageInMs = now.valueOf() - notification.createdAt.valueOf()
        return ageInMs < maxAgeInMs
      })
    })
  }

  useNotifications(addNotification)
  useInterval(expireOldNotifications, 10000)

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        showLatestNotification,
        hideNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}
