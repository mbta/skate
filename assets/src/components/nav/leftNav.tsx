import React, { useState, useContext } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { displayHelp } from "../../helpers/appCue"
import { openDrift } from "../../helpers/drift"
import { tagManagerEvent } from "../../helpers/googleTagManager"
import NotificationBellIcon from "../notificationBellIcon"
import {
  LadderIcon,
  MapIcon,
  LateIcon,
  SwingIcon,
  DoubleChevronRightIcon,
  DoubleChevronLeftIcon,
  QuestionMarkIcon,
  SpeechBubbleIcon,
  SettingsIcon,
  HamburgerIcon,
} from "../../helpers/icon"
import featureIsEnabled from "../../laboratoryFeatures"
import {
  openLateView,
  openSwingsView,
  OpenView,
  openNotificationDrawer,
  togglePickerContainer,
} from "../../state"
import NavMenu from "./navMenu"
import { mapModeForUser } from "../../util/mapMode"
import Tippy from "@tippyjs/react"

interface Props {
  toggleMobileMenu?: () => void
  defaultToCollapsed: boolean
  dispatcherFlag: boolean
  allowViews: boolean
  closePickerOnViewOpen?: boolean
}

const LeftNav = ({
  toggleMobileMenu,
  defaultToCollapsed,
  dispatcherFlag,
  allowViews,
  closePickerOnViewOpen,
}: Props): JSX.Element => {
  const [{ openView, mobileMenuIsOpen, pickerContainerIsVisible }, dispatch] =
    useContext(StateDispatchContext)
  const [collapsed, setCollapsed] = useState<boolean>(defaultToCollapsed)
  const location = useLocation()
  const mapMode = mapModeForUser()

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
      {toggleMobileMenu ? (
        <button
          className="m-left-nav__menu-button"
          onClick={toggleMobileMenu}
          title="Menu"
        >
          <HamburgerIcon className="m-top-nav-mobile__icon" />
        </button>
      ) : null}
      <div className="m-left-nav__modes-and-views">
        <ul className="m-left-nav__links">
          <li>
            <NavLink
              className={({ isActive }) =>
                "m-left-nav__link" +
                (isActive ? " m-left-nav__link--active" : "")
              }
              title="Route Ladders"
              to="/"
            >
              <LadderIcon className="m-left-nav__icon" />
              {collapsed ? null : "Route Ladders"}
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                "m-left-nav__link" +
                (isActive ? " m-left-nav__link--active" : "")
              }
              title="Shuttle Map"
              to="/shuttle-map"
            >
              <MapIcon className="m-left-nav__icon" />
              {collapsed ? null : "Shuttle Map"}
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                "m-left-nav__link" +
                (isActive ? " m-left-nav__link--active" : "")
              }
              title={mapMode.title}
              to={mapMode.path}
              onClick={() => {
                if (mapMode.navEventText && window.FS) {
                  window.FS.event(mapMode.navEventText)
                }
              }}
            >
              <mapMode.navIcon className="m-left-nav__icon" />
              {collapsed ? null : mapMode.title}
            </NavLink>
          </li>
          <li>
            <hr />
          </li>
          {featureIsEnabled("late_view") || dispatcherFlag ? (
            <li>
              <ViewToggle
                icon={
                  <LateIcon className="m-left-nav__icon m-left-nav__icon--late-view" />
                }
                name="Late View"
                viewIsOpen={openView === OpenView.Late}
                toggleView={() => {
                  tagManagerEvent("late_view_toggled")
                  dispatch(openLateView())

                  if (closePickerOnViewOpen && pickerContainerIsVisible) {
                    dispatch(togglePickerContainer())
                  }
                }}
                collapsed={collapsed}
                disabled={!allowViews}
              />
            </li>
          ) : null}
          <li>
            <ViewToggle
              icon={
                <SwingIcon className="m-left-nav__icon m-left-nav__icon--swings-view" />
              }
              name="Swings View"
              viewIsOpen={openView === OpenView.Swings}
              toggleView={() => {
                tagManagerEvent("swings_view_toggled")
                dispatch(openSwingsView())

                if (closePickerOnViewOpen && pickerContainerIsVisible) {
                  dispatch(togglePickerContainer())
                }
              }}
              collapsed={collapsed}
              disabled={!allowViews}
            />
          </li>
          <li>
            <ViewToggle
              icon={<NotificationBellIcon extraClasses={bellIconClasses} />}
              viewIsOpen={openView === OpenView.NotificationDrawer}
              toggleView={() => {
                dispatch(openNotificationDrawer())

                tagManagerEvent("notifications_opened")

                if (closePickerOnViewOpen && pickerContainerIsVisible) {
                  dispatch(togglePickerContainer())
                }
              }}
              name="Notifications"
              collapsed={collapsed}
              disabled={!allowViews}
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
                <SpeechBubbleIcon className="m-left-nav__icon" />
                {collapsed ? null : "Support"}
              </button>
            </li>
            <li>
              <button
                className="m-left-nav__link"
                onClick={() => displayHelp(location)}
                title="About Skate"
              >
                <QuestionMarkIcon className="m-left-nav__icon" />
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
                <SettingsIcon className="m-left-nav__icon" />
                {collapsed ? null : "Settings"}
              </NavLink>
            </li>
            <li>
              <button
                className="m-left-nav__link"
                onClick={() => setCollapsed(!collapsed)}
                title={collapsed ? "Expand" : "Collapse"}
              >
                {collapsed ? (
                  <DoubleChevronRightIcon className="m-left-nav__icon" />
                ) : (
                  <DoubleChevronLeftIcon className="m-left-nav__icon" />
                )}
                {collapsed ? null : "Collapse"}
              </button>
            </li>
          </ul>
        )}
      </div>
    </div>
  )
}

const ViewToggle = ({
  icon,
  name,
  viewIsOpen,
  toggleView,
  collapsed,
  disabled,
}: {
  icon: JSX.Element
  name: string
  viewIsOpen: boolean
  toggleView: () => void
  collapsed: boolean
  disabled?: boolean
}): JSX.Element => {
  const buttonContent = (
    <button
      className={
        "m-left-nav__link m-left-nav__view" +
        (viewIsOpen ? " m-left-nav__view--active" : "") +
        (disabled ? " m-left-nav__view--disabled" : "")
      }
      onClick={toggleView}
      title={name}
      aria-disabled={disabled}
    >
      {icon}
      {collapsed ? null : name}
    </button>
  )

  if (disabled) {
    return (
      <Tippy content="Not available in Search Map" placement="right">
        {buttonContent}
      </Tippy>
    )
  }

  return buttonContent
}

export default LeftNav
