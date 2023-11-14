import React, { useContext, useLayoutEffect, useRef, useState } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useCurrentTime from "../hooks/useCurrentTime"
import { markAllAsRead } from "../hooks/useNotificationsReducer"
import { Notification } from "../realtime.d"
import { rememberNotificationDrawerScrollPosition } from "../state"
import { openVPPForNotification } from "./notifications"
import { NotificationCard } from "./notificationCard"
import ViewHeader from "./viewHeader"
import Loading from "./loading"
import { usePanelStateFromStateDispatchContext } from "../hooks/usePanelState"

const NotificationDrawer = () => {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const [{ notificationDrawerScrollPosition }, dispatch] =
    useContext(StateDispatchContext)
  const {
    currentView: { previousView },
    closeView,
    openPreviousView,
  } = usePanelStateFromStateDispatchContext()
  const [isInitialRender, setIsInitialRender] = useState<boolean>(true)

  useLayoutEffect(() => {
    const element = elementRef.current

    if (isInitialRender && element) {
      setIsInitialRender(false)

      element.scrollTop = notificationDrawerScrollPosition
    }

    return () => {
      if (element) {
        dispatch(rememberNotificationDrawerScrollPosition(element.scrollTop))
      }
    }
  }, [isInitialRender, notificationDrawerScrollPosition, dispatch])

  return (
    <div className="c-notification-drawer" ref={elementRef}>
      <ViewHeader
        title="Notifications"
        closeView={() => {
          // reset scrollTop to avoid race condition with useEffect cleanup
          if (elementRef.current) {
            elementRef.current.scrollTop = 0
          }

          closeView()
        }}
        backlinkToView={previousView}
        followBacklink={openPreviousView}
      />
      <div className="c-notification-drawer__content">
        <Content />
      </div>
    </div>
  )
}

const Content = () => {
  const { notifications, dispatch: notificationsDispatch } =
    useContext(NotificationsContext)

  const currentTime = useCurrentTime()

  const [, stateDispatch] = useContext(StateDispatchContext)

  const openVPPForCurrentVehicle = (notification: Notification) => {
    openVPPForNotification(notification, stateDispatch, notificationsDispatch)
  }

  if (notifications === null) {
    return <Loading />
  }

  if (notifications.length === 0) {
    return <EmptyMessage />
  }

  const unreadNotificationsCount = notifications.filter(
    (notification) => notification.state === "unread"
  ).length

  return (
    <div className="c-notification-drawer__cards">
      <div className="c-notification-drawer__header">
        <span className="c-notification-drawer__n-unread">
          {unreadNotificationsCount} new
        </span>
        {unreadNotificationsCount > 0 ? (
          <button
            className="c-notification-drawer__mark-all-read-button"
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
