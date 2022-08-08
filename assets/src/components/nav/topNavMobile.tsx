import React from "react"
import { useLocation, Link, NavLink } from "react-router-dom"
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
  pathname: string,
  routeTabs: RouteTab[]
): string => {
  let tabName = "Skate"

  if (pathname === "/") tabName = currentTabName(routeTabs)
  else tabName = toTitleCase(pathname.replace("/", "").replace("-", " "))

  return tabName
}

interface Props {
  toggleMobileMenu: () => void
  openNotificationDrawer: () => void
  routeTabs: RouteTab[]
  mobileMenuIsOpen: boolean
}

const TopNavMobile: React.FC<Props> = ({
  toggleMobileMenu,
  openNotificationDrawer,
  routeTabs,
  mobileMenuIsOpen,
}) => {
  const location = useLocation()

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
            onClick={toggleMobileMenu}
            to="/"
            title="Skate"
          >
            {logoIcon("m-top-nav-mobile__logo-icon")}
          </Link>

          <button
            className="m-top-nav-mobile__close"
            onClick={toggleMobileMenu}
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
                toggleMobileMenu()
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
                toggleMobileMenu()
              }}
              title="About Skate"
            >
              {questionMarkIcon("m-top-nav-mobile__menu-icon")}
              About Skate
            </button>
          </li>

          <li>
            <NavLink
              className={({ isActive }) =>
                "m-top-nav-mobile__menu-link" +
                (isActive ? " m-top-nav-mobile__menu-link--active" : "")
              }
              title="Settings"
              to="/settings"
              onClick={toggleMobileMenu}
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
        onClick={toggleMobileMenu}
        onKeyDown={toggleMobileMenu}
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
            className="m-top-nav-mobile__left-item"
            onClick={toggleMobileMenu}
            title="Menu"
          >
            {hamburgerIcon("m-top-nav-mobile__icon")}
          </button>
        </div>

        <div className="m-top-nav-mobile__header-text">
          {pageOrTabName(location.pathname, routeTabs)}
        </div>

        <div className="m-top-nav-mobile__right-items">
          <button
            className="m-top-nav-mobile__right-item"
            onClick={openNotificationDrawer}
            title="Notifications"
          >
            <NotificationBellIcon
              extraClasses={["m-top-nav__notifications-icon"]}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TopNavMobile
