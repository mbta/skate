import React, { useState, useContext } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { displayHelp } from "../../helpers/appCue"
import { openDrift } from "../../helpers/drift"
import { tagManagerEvent } from "../../helpers/googleTagManager"
import NotificationBellIcon from "../notificationBellIcon"
import {
  ladderIcon,
  mapIcon,
  searchIcon,
  lateIcon,
  swingIcon,
  doubleChevronRightIcon,
  doubleChevronLeftIcon,
  questionMarkIcon,
  speechBubbleIcon,
  settingsIcon,
  hamburgerIcon,
} from "../../helpers/icon"
import featureIsEnabled from "../../laboratoryFeatures"
import {
  openLateView,
  openSwingsView,
  OpenView,
  openNotificationDrawer,
} from "../../state"
import NavMenu from "./navMenu"

interface Props {
  toggleMobileMenu?: () => void
  defaultToCollapsed: boolean
  dispatcherFlag: boolean
}

const LeftNav = ({
  toggleMobileMenu,
  defaultToCollapsed,
  dispatcherFlag,
}: Props): JSX.Element => {
  const [{ openView, mobileMenuIsOpen }, dispatch] =
    useContext(StateDispatchContext)
  const [collapsed, setCollapsed] = useState<boolean>(defaultToCollapsed)
  const location = useLocation()

  const bellIconClasses =
    openView == OpenView.NotificationDrawer
      ? [
          "m-left-nav__icon",
          "m-left-nav__icon--notifications-view",
          "m-left-nav__icon--notifications-view--active",
        ]
      : ["m-left-nav__icon", "m-left-nav__icon--notifications-view"]

  return (
    <div className={"m-left-nav" + (collapsed ? " m-left-nav--collapsed" : "")}>
      {toggleMobileMenu ? (
        <NavMenu
          mobileMenuIsOpen={mobileMenuIsOpen}
          toggleMobileMenu={toggleMobileMenu}
        />
      ) : null}
      <ul className="m-left-nav__links">
        {toggleMobileMenu ? (
          <>
            <li>
              <button
                className="m-left-nav__link"
                onClick={toggleMobileMenu}
                title="Menu"
              >
                {hamburgerIcon("m-top-nav-mobile__icon")}
              </button>
            </li>
            <li>
              <hr />
            </li>
          </>
        ) : null}
        <li>
          <NavLink
            className={({ isActive }) =>
              "m-left-nav__link" + (isActive ? " m-left-nav__link--active" : "")
            }
            title="Route Ladders"
            to="/"
          >
            {ladderIcon("m-left-nav__icon")}
            {collapsed ? null : "Route Ladders"}
          </NavLink>
        </li>
        <li>
          <NavLink
            className={({ isActive }) =>
              "m-left-nav__link" + (isActive ? " m-left-nav__link--active" : "")
            }
            title="Shuttle Map"
            to="/shuttle-map"
          >
            {mapIcon("m-left-nav__icon")}
            {collapsed ? null : "Shuttle Map"}
          </NavLink>
        </li>
        <li>
          <NavLink
            className={({ isActive }) =>
              "m-left-nav__link" + (isActive ? " m-left-nav__link--active" : "")
            }
            title="Search"
            to="/search"
          >
            {searchIcon("m-left-nav__icon")}
            {collapsed ? null : "Search"}
          </NavLink>
        </li>
        <li>
          <hr />
        </li>
        {featureIsEnabled("late_view") || dispatcherFlag ? (
          <li>
            <ViewToggle
              icon={lateIcon("m-left-nav__icon m-left-nav__icon--late-view")}
              name="Late View"
              viewIsOpen={openView === OpenView.Late}
              toggleView={() => {
                tagManagerEvent("late_view_toggled")
                dispatch(openLateView())
              }}
              collapsed={collapsed}
            />
          </li>
        ) : null}
        <li>
          <ViewToggle
            icon={swingIcon("m-left-nav__icon m-left-nav__icon--swings-view")}
            name="Swings View"
            viewIsOpen={openView === OpenView.Swings}
            toggleView={() => {
              tagManagerEvent("swings_view_toggled")
              dispatch(openSwingsView())
            }}
            collapsed={collapsed}
          />
        </li>
        <li>
          <ViewToggle
            icon={<NotificationBellIcon extraClasses={bellIconClasses} />}
            viewIsOpen={openView === OpenView.NotificationDrawer}
            toggleView={() => {
              dispatch(openNotificationDrawer())
            }}
            name="Notifications"
            collapsed={collapsed}
          />
        </li>
      </ul>
      {toggleMobileMenu ? null : (
        <ul className="m-left-nav__links">
          <li>
            <button
              className="m-left-nav__link"
              onClick={openDrift}
              title="Support"
            >
              {speechBubbleIcon("m-left-nav__icon")}
              {collapsed ? null : "Support"}
            </button>
          </li>
          <li>
            <button
              className="m-left-nav__link"
              onClick={() => displayHelp(location)}
              title="About Skate"
            >
              {questionMarkIcon("m-left-nav__icon")}
              {collapsed ? null : "About Skate"}
            </button>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                "m-left-nav__link" +
                (isActive ? " m-left-nav__link--active" : "")
              }
              title="Settings"
              to="/settings"
            >
              {settingsIcon("m-left-nav__icon")}
              {collapsed ? null : "Settings"}
            </NavLink>
          </li>
          <li>
            <button
              className="m-left-nav__link"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed
                ? doubleChevronRightIcon("m-left-nav__icon")
                : doubleChevronLeftIcon("m-left-nav__icon")}
              {collapsed ? null : "Collapse"}
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}

const ViewToggle = ({
  icon,
  name,
  viewIsOpen,
  toggleView,
  collapsed,
}: {
  icon: JSX.Element
  name: string
  viewIsOpen: boolean
  toggleView: () => void
  collapsed: boolean
}): JSX.Element => {
  return (
    <button
      className={
        "m-left-nav__link m-left-nav__view" +
        (viewIsOpen ? " m-left-nav__view--active" : "")
      }
      onClick={toggleView}
      title={name}
    >
      {icon}
      {collapsed ? null : name}
    </button>
  )
}

export default LeftNav
