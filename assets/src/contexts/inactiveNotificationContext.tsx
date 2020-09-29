import React, { createContext, ReactElement } from "react"
import { Notification } from "../realtime.d"

export const InactiveNotificationContext = createContext<
  [Notification | null, (notification: Notification | null) => void]
>(
  // tslint:disable-next-line no-empty
  [null, () => {}]
)

export const InactiveNotificationProvider = ({
  notification,
  setInactiveNotification,
  children,
}: {
  notification: Notification | null
  setInactiveNotification: (notification: Notification | null) => void
  children: ReactElement<HTMLElement>
}) => {
  return (
    <InactiveNotificationContext.Provider
      value={[notification, setInactiveNotification]}
    >
      {children}
    </InactiveNotificationContext.Provider>
  )
}
