import React, { useContext } from "react"
import { useLocation } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { hamburgerIcon } from "../../helpers/icon"
import { toggleNotificationDrawer } from "../../state"
import NotificationBellIcon from "../notificationBellIcon"
import { currentRouteTab } from "../../models/routeTab"


const topNavMobile = (): JSX.Element => {
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
    <div className="m-top-nav-mobile">

      <div className="m-top-nav__left-items">
          {hamburgerIcon("m-top-nav__icon")}
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


    </div>
  )
}

export default topNavMobile
