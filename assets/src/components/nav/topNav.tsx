import React, { useContext } from "react"
import { Link } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { logoIcon, refreshIcon } from "../../helpers/icon"
import { reload } from "../../models/browser"
import { openNotificationDrawer, OpenView } from "../../state"
import NotificationBellIcon from "../notificationBellIcon"

const TopNav = (): JSX.Element => {
  const [{ openView }, dispatch] = useContext(StateDispatchContext)

  const bellIconClasses =
    openView === OpenView.NotificationDrawer
      ? [
          "m-top-nav__notifications-icon",
          "m-top-nav__notifications-icon--active",
        ]
      : ["m-top-nav__notifications-icon"]

  return (
    <div className="m-top-nav">
      <Link className="m-top-nav__logo" to="/" title="Skate">
        {logoIcon("m-top-nav__logo-icon")}
      </Link>
      <ul className="m-top-nav__right-items">
        <li>
          <button
            className="m-top-nav__right-item"
            onClick={() => dispatch(openNotificationDrawer())}
            title="Notifications"
          >
            <NotificationBellIcon extraClasses={bellIconClasses} />
          </button>
        </li>
        <li>
          <button
            className="m-top-nav__right-item"
            onClick={() => reload()}
            title="Refresh"
          >
            {refreshIcon("m-top-nav__icon")}
          </button>
        </li>
      </ul>
    </div>
  )
}

export default TopNav
