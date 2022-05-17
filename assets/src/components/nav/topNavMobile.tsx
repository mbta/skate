import React, { useContext, useState } from "react"
import { useLocation, Link, NavLink } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import {
  closeIcon,
  hamburgerIcon,
  logoIcon,
  questionMarkIcon,
  refreshIcon,
  settingsIcon,
  speechBubbleIcon 
} from "../../helpers/icon"
import { toggleNotificationDrawer } from "../../state"
import NotificationBellIcon from "../notificationBellIcon"
import { currentRouteTab } from "../../models/routeTab"
import { openDrift } from "../../helpers/drift"
import { reload } from "../../models/browser"

const topNavMobile = (): JSX.Element => {

  const [collapsed, setCollapsed] = useState(true)

  const location = useLocation()

  const [state, dispatch] =
    useContext(StateDispatchContext)

  const { routeTabs, notificationDrawerIsOpen } = state

  const bellIconClasses = notificationDrawerIsOpen
    ? ["m-top-nav__notifications-icon", "m-top-nav__notifications-icon--active"]
    : ["m-top-nav__notifications-icon"]

  let tabName = "";
  const showTabName = location.pathname === "/"
  const currentTab = currentRouteTab(routeTabs)
  if(showTabName) tabName = currentTab.presetName || "Untitled"

  return (
    <div id="topNavMobile" className="m-top-nav-mobile">

      <div className="m-top-nav__left-items">
          <button
            className="m-top-nav__left-item"
            onClick={ () => setCollapsed(false) }
            title="Menu"
            >
            {hamburgerIcon("m-top-nav__icon")}
          </button>
      </div>

      <div>
          {tabName}
      </div>

      <div className="m-top-nav__right-items">
        <button
          className="m-top-nav__right-item"
          onClick={() => dispatch(toggleNotificationDrawer())}
          title="Notifications"
        >
          <NotificationBellIcon extraClasses={bellIconClasses} />
        </button>
      </div>


      <div className={"m-top-nav-mobile__menu" + (collapsed ? " m-top-nav-mobile__menu--collapsed" : "")}>
        <div className="m-top-nav-mobile__menu-header">
          
          <Link className="m-top-nav__logo" to="/" title="Skate">
            {logoIcon("m-top-nav__logo-icon")}
          </Link>

         <button
          className="m-top-nav-mobile__close"
          onClick={ () => setCollapsed(true) }
          title="Close"
          >
            { closeIcon("m-top-nav-mobile__close-icon") }
          </button>

        </div>
        <ul className="m-top-nav-mobile__links">

          <li>
            <button
              className="m-top-nav-mobile__menu-button"
              onClick={() => reload()}
              title="Refresh"
            >
              {refreshIcon("m-top-nav-mobile__menu-icon")}
              Refresh
            </button>
          </li>

          <li>
            <button
              className="m-top-nav-mobile__menu-button"
              onClick={openDrift}
              title="Support"
            >
              {speechBubbleIcon("m-top-nav-mobile__menu-icon")}
              Support
            </button>
          </li>

          <li>
            <button
              className="m-top-nav-mobile__menu-button"
              onClick={() => displayHelp(location)}
              title="About Skate"
            >
              {questionMarkIcon("m-top-nav-mobile__menu-icon")}
              About Skate
            </button>
          </li>

          <li>
            <NavLink
              className="m-top-nav-mobile__menu-link"
              exact={true}
              title="Settings"
              to="/settings"
            >
              {settingsIcon("m-top-nav-mobile__menu-icon")}
              Settings
            </NavLink>
          </li>
        </ul>
      </div>

    </div>
  )
}

export default topNavMobile
