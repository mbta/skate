import React, { useState, useContext } from "react"
import { useLocation } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { displayHelp } from "../../helpers/appCue"
import { openDrift } from "../../helpers/drift"
import {
  hamburgerIcon
} from "../../helpers/icon"
import { toggleNotificationDrawer } from "../../state"
import NotificationBellIcon from "../notificationBellIcon"
import featureIsEnabled from "../../laboratoryFeatures"
import { OpenView, toggleLateView, toggleSwingsView } from "../../state"

const topNavMobile = (): JSX.Element => {
  const location = useLocation()

  const [{ notificationDrawerIsOpen }, dispatch] =
    useContext(StateDispatchContext)

  const bellIconClasses = notificationDrawerIsOpen
    ? ["m-top-nav__notifications-icon", "m-top-nav__notifications-icon--active"]
    : ["m-top-nav__notifications-icon"]

  return (
    <div className="m-top-nav-mobile">

      <div className="m-top-nav__left-items">
          {hamburgerIcon("m-top-nav__icon")}
      </div>

      <div>
          Mobile Nav Test!
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
