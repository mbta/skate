import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { closeNotificationDrawer } from "../state"
import CloseButton from "./closeButton"
import NotificationBellIcon from "./notificationBellIcon"

const NotificationDrawer = () => {
  const [, dispatch] = useContext(StateDispatchContext)
  return (
    <div className="m-notification-drawer">
      <div className="m-notification-drawer__title-bar">
        <NotificationBellIcon />
        <div className="m-notification-drawer__title">Notifications</div>
        <CloseButton
          onClick={() => {
            dispatch(closeNotificationDrawer())
          }}
        />
      </div>
    </div>
  )
}

export default NotificationDrawer
