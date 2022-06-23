import React, { useContext } from "react"
import { Location } from "history"
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
import { currentTabName, RouteTab } from "../../models/routeTab"
import { openDrift } from "../../helpers/drift"
import { reload } from "../../models/browser"

export const toTitleCase = (str: string): string => {
  return str.replace(
    /\w\S*/g,
    (txt: string): string =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

export const pageOrTabName = (
  location: Location<unknown>,
  routeTabs: RouteTab[]
): string => {
  let tabName = "Skate"

  if (location.pathname === "/") tabName = currentTabName(routeTabs)
  else
    tabName = toTitleCase(location.pathname.replace("/", "").replace("-", " "))

  return tabName
}

const TopNavMobile = (): JSX.Element => {
  const location = useLocation()

  const [state, dispatch] = useContext(StateDispatchContext)

  const toggleVisibility = () => dispatch(toggleMobileMenu())

  const { routeTabs, notificationDrawerIsOpen, mobileMenuIsOpen } = state

  const bellIconClasses = notificationDrawerIsOpen
    ? ["m-top-nav__notifications-icon", "m-top-nav__notifications-icon--active"]
    : ["m-top-nav__notifications-icon"]

  return (
    <div className="m-top-nav-mobile" data-testid="top-nav-mobile">
      <div
        className={
          "m-top-nav-mobile__menu" +
          (mobileMenuIsOpen
            ? " m-top-nav-mobile__menu--open"
            : " m-top-nav-mobile__menu--closed")
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
              onClick={reload}
              title="Refresh"
            >
              {refreshIcon("m-top-nav-mobile__menu-icon")}
              Refresh
            </button>
          </li>
          <li>
            <button
              className="m-top-nav-mobile__menu-button"
              onClick={() => {
                openDrift()
                toggleVisibility()
              }}
              title="Support"
            >
              {speechBubbleIcon("m-top-nav-mobile__menu-icon")}
              Support
            </button>
          </li>
          <li>
            <button
              className="m-top-nav-mobile__menu-button"
              onClick={() => {
                displayHelp(location)
                toggleVisibility()
              }}
              title="About Skate"
            >
              {questionMarkIcon("m-top-nav-mobile__menu-icon")}
              About Skate
            </button>
          </li>

          <li>
            <NavLink
              className={({ isActive }) => "m-top-nav-mobile__menu-link" + (isActive ? " m-top-nav-mobile__menu-link--active" : "")}
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
          "m-top-nav-mobile__overlay" +
          (mobileMenuIsOpen ? " m-top-nav-mobile__overlay--open" : "")
        }
        onClick={toggleVisibility}
        onKeyDown={toggleVisibility}
        aria-hidden={true}
      />

      <div
        className={
          "m-top-nav-mobile__inner" +
          (mobileMenuIsOpen ? " blurred-mobile" : "")
        }
      >
        <div className="m-top-nav-mobile__left-items">
          <button
            className="m-top-nav=mobile__left-item"
            onClick={toggleVisibility}
            title="Menu"
          >
            {hamburgerIcon("m-top-nav-mobile__icon")}
          </button>
        </div>

        <div className="m-top-nav-mobile__header-text">
          {pageOrTabName(location, routeTabs)}
        </div>

        <div className="m-top-nav-mobile__right-items">
          <button
            className="m-top-nav-mobile__right-item"
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

export default TopNavMobile
