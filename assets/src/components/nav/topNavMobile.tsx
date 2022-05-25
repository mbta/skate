import React, { useContext } from "react"
import { useLocation, Link, NavLink } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { displayHelp } from "../../helpers/appCue"
import {
  closeIcon,
  hamburgerIcon,
  logoIcon,
  questionMarkIcon,
  refreshIcon,
  settingsIcon,
  speechBubbleIcon,
} from "../../helpers/icon"
import { toggleMobileMenu, toggleNotificationDrawer } from "../../state"
import NotificationBellIcon from "../notificationBellIcon"
import { currentRouteTab } from "../../models/routeTab"
import { openDrift } from "../../helpers/drift"
import { reload } from "../../models/browser"

const topNavMobile = (): JSX.Element => {
  const location = useLocation()

  const [state, dispatch] = useContext(StateDispatchContext)

  const toggleVisibility = () => dispatch(toggleMobileMenu())

  const { routeTabs, notificationDrawerIsOpen, mobileMenuIsOpen } = state

  const bellIconClasses = notificationDrawerIsOpen
    ? ["m-top-nav__notifications-icon", "m-top-nav__notifications-icon--active"]
    : ["m-top-nav__notifications-icon"]

  let tabName = "Untitled"
  const showTabName = location.pathname === "/"
  const currentTab = currentRouteTab(routeTabs)
  if (showTabName && currentTab) tabName = currentTab.presetName || "Untitled"

  return (
    <div className="m-top-nav-mobile" data-testid="top-nav-mobile">
      <div
        className={
          "m-top-nav-mobile__menu" +
          (mobileMenuIsOpen
            ? " m-top-nav-mobile__menu-open"
            : " m-top-nav-mobile__menu-closed")
        }
      >
        <div className="m-top-nav-mobile__menu-header">
          <Link
            className="m-top-nav__logo"
            onClick={toggleVisibility}
            to="/"
            title="Skate"
          >
            {logoIcon("m-top-nav-mobile__logo-icon")}
          </Link>

          <button
            className="m-top-nav-mobile__close"
            onClick={toggleVisibility}
            title="Close"
          >
            {closeIcon("m-top-nav-mobile__close-icon")}
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
              onClick={toggleVisibility}
            >
              {settingsIcon("m-top-nav-mobile__menu-icon")}
              Settings
            </NavLink>
          </li>
        </ul>
      </div>

      <div
        data-testid="mobile-overlay"
        className={
          "m-top-nav-mobile-overlay" +
          (mobileMenuIsOpen ? " m-top-nav-mobile-overlay__open" : "")
        }
        onClick={toggleVisibility}
        onKeyDown={toggleVisibility}
        aria-hidden={true}
      ></div>

      <div
        className={
          "m-top-nav-mobile-content" + (mobileMenuIsOpen ? " blurred" : "")
        }
      >
        <div className="m-top-nav__left-items">
          <button
            className="m-top-nav__left-item"
            onClick={toggleVisibility}
            title="Menu"
          >
            {hamburgerIcon("m-top-nav-mobile__icon")}
          </button>
        </div>

        <div className="m-top-nav-mobile__header-text">{tabName}</div>

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
    </div>
  )
}

export default topNavMobile
