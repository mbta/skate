import React from "react"
import { useLocation } from "react-router-dom"
import { HamburgerIcon } from "../../helpers/icon"
import NotificationBellIcon from "../notificationBellIcon"
import { currentTabName, RouteTab } from "../../models/routeTab"
import NavMenu from "./navMenu"
import { tagManagerEvent } from "../../helpers/googleTagManager"
import { searchMapConfig } from "../../util/mapMode"

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
  if (pathname === "/") return currentTabName(routeTabs)
  if (pathname === searchMapConfig.path) return searchMapConfig.title
  else return toTitleCase(pathname.replace("/", "").replace("-", " "))
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
    <div className="c-top-nav-mobile" data-testid="top-nav-mobile">
      <NavMenu
        mobileMenuIsOpen={mobileMenuIsOpen}
        toggleMobileMenu={toggleMobileMenu}
      />
      <div
        className={
          "c-top-nav-mobile__inner" +
          (mobileMenuIsOpen ? " blurred-mobile" : "")
        }
      >
        <div className="c-top-nav-mobile__left-items">
          <button
            className="c-top-nav-mobile__left-item"
            onClick={toggleMobileMenu}
            title="Menu"
          >
            <HamburgerIcon className="c-top-nav-mobile__icon" />
          </button>
        </div>

        <div className="c-top-nav-mobile__header-text">
          {pageOrTabName(location.pathname, routeTabs)}
        </div>

        <div className="c-top-nav-mobile__right-items">
          <button
            className="c-top-nav-mobile__right-item"
            onClick={() => {
              openNotificationDrawer()

              tagManagerEvent("notifications_opened")
            }}
            title="Notifications"
          >
            <NotificationBellIcon
              extraClasses={["c-top-nav-mobile__notifications-icon"]}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TopNavMobile
