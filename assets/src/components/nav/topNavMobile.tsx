import React from "react"
import { useLocation } from "react-router-dom"
import { hamburgerIcon } from "../../helpers/icon"
import NotificationBellIcon from "../notificationBellIcon"
import { currentTabName, RouteTab } from "../../models/routeTab"
import NavMenu from "./navMenu"

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
      <NavMenu
        mobileMenuIsOpen={mobileMenuIsOpen}
        toggleMobileMenu={toggleMobileMenu}
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
