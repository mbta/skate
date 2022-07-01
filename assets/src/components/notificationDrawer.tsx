import React, { useContext, useLayoutEffect, useRef, useState } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useCurrentTime from "../hooks/useCurrentTime"
import { markAllAsRead } from "../hooks/useNotificationsReducer"
import { Notification } from "../realtime.d"
import { closeNotificationDrawer } from "../state"
import CloseButton from "./closeButton"
import { openVPPForNotification } from "./notifications"
import NotificationBellIcon from "./notificationBellIcon"
import { NotificationCard } from "./notificationContent"

const NotificationDrawer = () => {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const { rememberScrollPosition, scrollPosition } =
    useContext(NotificationsContext)

  const [isInitialRender, setIsInitialRender] = useState<boolean>(true)

  /* eslint-disable react-hooks/exhaustive-deps */
  useLayoutEffect(() => {
    const restoreScrollPosition = isInitialRender
    setIsInitialRender(false)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentElement = elementRef.current!

    if (restoreScrollPosition && elementRef) {
      const element = elementRef.current
      if (element) {
        element.scrollTop = scrollPosition
      }
    }

    return () => {
      rememberScrollPosition(currentElement.scrollTop)
    }
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <div className="m-notification-drawer" ref={elementRef}>
      <TitleBar />
      <div className="m-notification-drawer__content">
        <Content />
      </div>
    </div>
  )
}

const TitleBar = () => {
  const [, dispatch] = useContext(StateDispatchContext)
  return (
    <div className="m-notification-drawer__title-bar">
      <NotificationBellIcon />
      <div className="m-notification-drawer__title">Notifications</div>
      <CloseButton
        onClick={() => {
          dispatch(closeNotificationDrawer())
        }}
      />
    </div>
  )
}

const Content = () => {
  const { notifications } = useContext(NotificationsContext)
  const notificationsDispatch = useContext(NotificationsContext).dispatch

  const currentTime = useCurrentTime()

  const [, stateDispatch] = useContext(StateDispatchContext)

  const openVPPForCurrentVehicle = (notification: Notification) => {
    openVPPForNotification(notification, stateDispatch, notificationsDispatch)
  }

  if (notifications.length === 0) {
    return <EmptyMessage />
  }

  const unreadNotificationsCount = notifications.filter(
    (notification) => notification.state === "unread"
  ).length

  return (
    <div className="m-notification-drawer__cards">
      <div className="m-notification-drawer__header">
        <span className="m-notification-drawer__n-unread">
          {unreadNotificationsCount} new
        </span>
        {unreadNotificationsCount > 0 ? (
          <button
            className="m-notification-drawer__mark-all-read-button"
            onClick={() => notificationsDispatch(markAllAsRead())}
          >
            Mark all as read
          </button>
        ) : null}
      </div>
      <ul>
        {notifications.map((notification) => (
          <li key={notification.id}>
            <NotificationCard
              notification={notification}
              currentTime={currentTime}
              openVPPForCurrentVehicle={openVPPForCurrentVehicle}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

const EmptyMessage = () => (
  <>
    <p>You have no notifications currently.</p>
    <p>
      Here you&apos;ll be notified about events like accidents and ghost
      vehicles on any bus routes you have selected on the Route Ladders page.
    </p>
  </>
)

export default NotificationDrawer
