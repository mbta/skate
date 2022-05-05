import React, { useContext } from "react"
import { NavLink } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { logoIcon, refreshIcon, settingsIcon } from "../../helpers/icon"
import { reload } from "../../models/browser"
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
        <button
          className="m-top-nav__right-item"
          onClick={() => reload()}
          title="Refresh"
        >
          {refreshIcon("m-top-nav__icon")}
        </button>
        <NavLink
          activeClassName="m-top-nav__right-item--active"
          className="m-top-nav__right-item"
          exact={true}
          title="Settings"
          to="/settings"
        >
          {settingsIcon("m-top-nav__icon")}
        </NavLink>
      </div>
    </div>
  )
}

export default TopNav
