import React, { ComponentProps, useState, useContext } from "react"
import { NavLink } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { tagManagerEvent } from "../../helpers/googleTagManager"
import NotificationBellIcon from "../notificationBellIcon"
import {
  LateIcon,
  SwingIcon,
  HamburgerIcon,
  LadderIcon,
  MapIcon,
  SearchMapIcon,
  SpeechBubbleIcon,
} from "../../helpers/icon"
import { DetourNavIcon } from "../../helpers/navIcons"
import inTestGroup, { TestGroups } from "../../userInTestGroup"
import { togglePickerContainer } from "../../state"
import NavMenu from "./navMenu"
import Tippy from "@tippyjs/react"
import { fullStoryEvent } from "../../helpers/fullStory"
import { OpenView } from "../../state/pagePanelState"
import { usePanelStateFromStateDispatchContext } from "../../hooks/usePanelState"
import { LinkData, supportLinkUrl } from "../../navLinkData"
import {
  ChevronDoubleLeft,
  ChevronDoubleRight,
  GearFill,
  QuestionFill,
} from "../../helpers/bsIcons"

interface LeftNavLinkProps {
  linkData: LinkData
}

const LeftNavLink = ({ linkData }: LeftNavLinkProps): JSX.Element => (
  <NavLink
    className={({ isActive }) =>
      "c-left-nav__link" + (isActive ? " c-left-nav__link--active" : "")
    }
    title={linkData.title}
    to={linkData.path}
    onClick={linkData.onClick}
  >
    <linkData.navIcon className="c-left-nav__icon" />
    {linkData.title}
  </NavLink>
)

interface Props {
  toggleMobileMenu?: () => void
  defaultToCollapsed: boolean
  dispatcherFlag: boolean
  closePickerOnViewOpen?: boolean
}

const LeftNav = ({
  toggleMobileMenu,
  defaultToCollapsed,
  dispatcherFlag,
  closePickerOnViewOpen,
}: Props): JSX.Element => {
  const [{ mobileMenuIsOpen, pickerContainerIsVisible }, dispatch] =
    useContext(StateDispatchContext)
  const {
    currentView: { openView },
    openLateView,
    openSwingsView,
    openNotificationDrawer,
  } = usePanelStateFromStateDispatchContext()

  const [collapsed, setCollapsed] = useState<boolean>(defaultToCollapsed)

  const bellIconClasses =
    openView == OpenView.NotificationDrawer
      ? [
          "c-left-nav__icon",
          "c-left-nav__icon--notifications-view",
          "c-left-nav__icon--notifications-view--active",
        ]
      : ["c-left-nav__icon", "c-left-nav__icon--notifications-view"]

  return (
    <div className={"c-left-nav" + (collapsed ? " c-left-nav--collapsed" : "")}>
      {toggleMobileMenu ? (
        <NavMenu
          mobileMenuIsOpen={mobileMenuIsOpen}
          toggleMobileMenu={toggleMobileMenu}
        />
      ) : null}
      {toggleMobileMenu ? (
        <button
          className="c-left-nav__menu-button"
          onClick={toggleMobileMenu}
          title="Menu"
        >
          <HamburgerIcon className="c-top-nav-mobile__icon" />
        </button>
      ) : null}
      <div className="c-left-nav__modes-and-views">
        <ul className="c-left-nav__links">
          <li>
            <LeftNavLink
              linkData={{
                title: "Route Ladders",
                path: "/",
                navIcon: LadderIcon,
              }}
            />
            <ul className="c-left-nav__submenu">
              <li>
                <ViewToggle
                  icon={<NotificationBellIcon extraClasses={bellIconClasses} />}
                  viewIsOpen={openView === OpenView.NotificationDrawer}
                  toggleView={() => {
                    openNotificationDrawer()

                    tagManagerEvent("notifications_opened")

                    if (closePickerOnViewOpen && pickerContainerIsVisible) {
                      dispatch(togglePickerContainer())
                    }
                  }}
                  name="Notifications"
                />
              </li>
              <li>
                <ViewToggle
                  icon={
                    <SwingIcon className="c-left-nav__icon c-left-nav__icon--swings-view" />
                  }
                  name="Swings View"
                  viewIsOpen={openView === OpenView.Swings}
                  toggleView={() => {
                    if (openView !== OpenView.Swings) {
                      // only fire event when opening
                      fullStoryEvent("User opened Swings View", {})
                    }

                    tagManagerEvent("swings_view_toggled")
                    openSwingsView()

                    if (closePickerOnViewOpen && pickerContainerIsVisible) {
                      dispatch(togglePickerContainer())
                    }
                  }}
                />
              </li>
              {inTestGroup(TestGroups.LateView) || dispatcherFlag ? (
                <li>
                  <ViewToggle
                    icon={
                      <LateIcon className="c-left-nav__icon c-left-nav__icon--late-view" />
                    }
                    name="Late View"
                    viewIsOpen={openView === OpenView.Late}
                    toggleView={() => {
                      tagManagerEvent("late_view_toggled")
                      if (openView !== OpenView.Late) {
                        // only fire event when opening
                        fullStoryEvent("User opened Late View", {})
                      }
                      openLateView()

                      if (closePickerOnViewOpen && pickerContainerIsVisible) {
                        dispatch(togglePickerContainer())
                      }
                    }}
                  />
                </li>
              ) : null}
            </ul>
          </li>
          <li>
            <LeftNavLink
              linkData={{
                title: "Shuttle Map",
                path: "/shuttle-map",
                navIcon: MapIcon,
              }}
            />{" "}
          </li>
          <li>
            <LeftNavLink
              linkData={{
                title: "Search Map",
                path: "/map",
                navIcon: SearchMapIcon,
                onClick: () =>
                  fullStoryEvent("Search Map nav entry clicked", {}),
              }}
            />
          </li>
          {inTestGroup(TestGroups.DetoursList) ? (
            <li>
              {" "}
              <LeftNavLink
                linkData={{
                  title: "Detours",
                  path: "/detours",
                  navIcon: (props: ComponentProps<"span">) => (
                    <span {...props}>
                      <DetourNavIcon />
                    </span>
                  ),
                }}
              />
            </li>
          ) : null}
        </ul>
        {toggleMobileMenu ? null : (
          <ul className="c-left-nav__links">
            <li>
              <a
                className="c-left-nav__link"
                href={supportLinkUrl}
                target="_blank"
                title="Report an Issue"
                rel="noopener noreferrer"
              >
                <SpeechBubbleIcon className="c-left-nav__icon c-left-nav__fill" />
                Report an Issue
              </a>
            </li>
            <li>
              <a
                className="c-left-nav__link"
                title="About Skate"
                target="_blank"
                href="/user-guide"
              >
                <span>
                  <QuestionFill className="c-left-nav__icon c-left-nav__fill" />
                </span>
                About Skate
              </a>
            </li>
            <li>
              <NavLink
                className={({ isActive }) =>
                  "c-left-nav__link" +
                  (isActive ? " c-left-nav__link--active" : "")
                }
                title="Settings"
                to="/settings"
              >
                <span>
                  <GearFill className="c-left-nav__icon c-left-nav__fill" />
                </span>
                Settings
              </NavLink>
            </li>
            <li>
              <button
                className="c-left-nav__link"
                onClick={() => setCollapsed(!collapsed)}
                title={collapsed ? "Expand" : "Collapse"}
              >
                <span>
                  {collapsed ? (
                    <ChevronDoubleRight className="c-left-nav__icon c-left-nav__fill" />
                  ) : (
                    <ChevronDoubleLeft className="c-left-nav__icon c-left-nav__fill" />
                  )}
                </span>
                Collapse
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
  disabled,
}: {
  icon: JSX.Element
  name: string
  viewIsOpen: boolean
  toggleView: () => void
  disabled?: boolean
}): JSX.Element => {
  const buttonContent = (
    <button
      className={
        "c-left-nav__link c-left-nav__view" +
        (viewIsOpen ? " c-left-nav__view--active" : "") +
        (disabled ? " c-left-nav__view--disabled" : "")
      }
      onClick={toggleView}
      title={name}
      aria-disabled={disabled}
    >
      {icon}
      {name}
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
