import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import {
  NotificationsContext,
  otherNotificationReadState,
} from "../contexts/notificationsContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { ellipsisIcon } from "../helpers/icon"
import useCurrentTime from "../hooks/useCurrentTime"
import {
  markAllAsRead,
  toggleReadState,
} from "../hooks/useNotificationsReducer"
import { Notification } from "../realtime.d"
import { closeNotificationDrawer } from "../state"
import CloseButton from "./closeButton"
import { isChelseaBridgeReason, openVPPForNotification } from "./notifications"
import NotificationBellIcon from "./notificationBellIcon"
import { NotificationContent } from "./notificationContent"

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
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          currentTime={currentTime}
          openVPPForCurrentVehicle={openVPPForCurrentVehicle}
        />
      ))}
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

const EllipsisSubmenu = ({ notification }: { notification: Notification }) => {
  const { dispatch, setNotificationWithOpenSubmenuId } =
    useContext(NotificationsContext)
  const submenuRef = useRef<HTMLDivElement | null>(null)
  const otherReadState = otherNotificationReadState(notification.state)

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const closeOnClickOutside = (event: MouseEvent) => {
      if (
        submenuRef &&
        submenuRef.current &&
        !event.composedPath().includes(submenuRef.current)
      ) {
        setNotificationWithOpenSubmenuId(null)
      }
    }

    document.addEventListener("mousedown", closeOnClickOutside)

    return () => {
      document.removeEventListener("mousedown", closeOnClickOutside)
    }
  }, [submenuRef])
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <>
      {/* eslint-disable jsx-a11y/click-events-have-key-events */}
      <div
        className="m-notification-drawer__submenu"
        ref={submenuRef}
        onClick={(event) => event.stopPropagation()}
        role="menu"
        tabIndex={0}
      >
        {/* eslint-enable jsx-a11y/click-events-have-key-events */}
        {/* eslint-disable jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events */}
        <a
          onClick={(event) => {
            event.stopPropagation()
            dispatch(toggleReadState(notification))
            setNotificationWithOpenSubmenuId(null)
          }}
          className={`m-notification-drawer__submenu-mark-${otherReadState}`}
          role="menuitem"
          tabIndex={-1}
        >
          mark as {otherReadState}
        </a>
        {/* eslint-enable jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events */}
      </div>
    </>
  )
}

const NotificationCard = ({
  notification,
  currentTime,
  openVPPForCurrentVehicle,
}: {
  notification: Notification
  currentTime: Date
  openVPPForCurrentVehicle: (notification: Notification) => void
}) => {
  const { notificationWithOpenSubmenuId, setNotificationWithOpenSubmenuId } =
    useContext(NotificationsContext)
  const showSubmenu = notification.id === notificationWithOpenSubmenuId
  const toggleShowSubmenu = () => {
    if (showSubmenu) {
      setNotificationWithOpenSubmenuId(null)
    } else {
      setNotificationWithOpenSubmenuId(notification.id)
    }
  }

  return (
    <button
      className={`m-notification-drawer__card m-notification-drawer__card--${notification.state}`}
      onClick={() => {
        if (window && window.FS) {
          if (isChelseaBridgeReason(notification.reason)) {
            window.FS.event("Chelsea bridge notification clicked")
          }
        }
        openVPPForCurrentVehicle(notification)
      }}
    >
      <NotificationContent
        notification={notification}
        currentTime={currentTime}
      />
      {showSubmenu && <EllipsisSubmenu notification={notification} />}
      {/* eslint-disable jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <a
        className="m-notification-drawer__submenu-icon-anchor"
        onClick={(event) => {
          event.stopPropagation()
          toggleShowSubmenu()
        }}
      >
        {ellipsisIcon("m-notification-drawer__submenu-icon")}
      </a>
      {/* eslint-enable jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
    </button>
  )
}

export default NotificationDrawer
