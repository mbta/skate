import React, { useContext } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { logoIcon } from "../../helpers/icon"
import { toggleNotificationDrawer } from "../../state"
import NotificationBellIcon from "../notificationBellIcon"

const TopNav = (): JSX.Element => {
  const [{ notificationDrawerIsOpen }, dispatch] =
    useContext(StateDispatchContext)

  const bellIconClasses = notificationDrawerIsOpen
    ? ["m-top-nav__notifications-icon", "m-top-nav__notifications-icon--active"]
    : ["m-top-nav__notifications-icon"]

  return (
    <div className="m-top-nav">
      {logoIcon("m-top-nav__logo")}
      <div className="m-top-nav__right-items">
        <button
          className="m-top-nav__right-item"
          onClick={() => dispatch(toggleNotificationDrawer())}
          title="Notifications"
        >
          <NotificationBellIcon extraClasses={bellIconClasses} />
        </button>
      </div>
    </div>
  )
}

export default TopNav
