import React, { ComponentProps, useState, useContext } from "react"
import { NavLink } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { tagManagerEvent } from "../../helpers/googleTagManager"
import NotificationBellIcon from "../notificationBellIcon"
import {
  LateIcon,
  SwingIcon,
  LadderIcon,
  MapIcon,
  SearchMapIcon,
  SpeechBubbleIcon,
} from "../../helpers/icon"
import { DetourNavIcon } from "../../helpers/navIcons"
import inTestGroup, { TestGroups } from "../../userInTestGroup"
import { togglePickerContainer } from "../../state"
import Tippy from "@tippyjs/react"
import { fullStoryEvent } from "../../helpers/fullStory"
import { OpenView } from "../../state/pagePanelState"
import { usePanelStateFromStateDispatchContext } from "../../hooks/usePanelState"
import { ButtonData, LinkData, supportLinkUrl } from "../../navLinkData"
import {
  ChevronDoubleLeft,
  ChevronDoubleRight,
  GearFill,
  QuestionFill,
} from "../../helpers/bsIcons"
import isDispatcher from "../../userIsDispatcher"

const LeftNavLink = ({
  title,
  path,
  NavIcon,
  onClick,
}: LinkData): JSX.Element => (
  <NavLink
    className={({ isActive }) =>
      "c-left-nav__link" + (isActive ? " c-left-nav__link--active" : "")
    }
    title={title}
    to={path}
    onClick={onClick}
  >
    <NavIcon className="c-left-nav__icon" />
    {title}
  </NavLink>
)

interface Props {
  deviceType: string
  closePickerOnViewOpen?: boolean
}

const LeftNav = ({ deviceType, closePickerOnViewOpen }: Props): JSX.Element => {
  const [{ pickerContainerIsVisible }, dispatch] =
    useContext(StateDispatchContext)
  const {
    currentView: { openView },
    openLateView,
    openSwingsView,
    openNotificationDrawer,
  } = usePanelStateFromStateDispatchContext()
  const dispatcherFlag = isDispatcher()

  const [collapsed, setCollapsed] = useState<boolean>(
    deviceType === "mobile_landscape_tablet_portrait" || deviceType === "tablet"
  )

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
      <div className="c-left-nav__modes-and-views">
        <ul className="c-left-nav__links">
          <li>
            <LeftNavLink title="Route Ladders" path="/" NavIcon={LadderIcon} />
            <ul className="c-left-nav__submenu">
              <li>
                <ViewToggle
                  NavIcon={() => (
                    <NotificationBellIcon extraClasses={bellIconClasses} />
                  )}
                  viewIsOpen={openView === OpenView.NotificationDrawer}
                  onClick={() => {
                    openNotificationDrawer()

                    tagManagerEvent("notifications_opened")

                    if (closePickerOnViewOpen && pickerContainerIsVisible) {
                      dispatch(togglePickerContainer())
                    }
                  }}
                  title="Notifications"
                />
              </li>
              <li>
                <ViewToggle
                  NavIcon={() => (
                    <SwingIcon className="c-left-nav__icon c-left-nav__icon--swings-view" />
                  )}
                  title="Swings View"
                  viewIsOpen={openView === OpenView.Swings}
                  onClick={() => {
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
                    NavIcon={() => (
                      <LateIcon className="c-left-nav__icon c-left-nav__icon--late-view" />
                    )}
                    title="Late View"
                    viewIsOpen={openView === OpenView.Late}
                    onClick={() => {
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
              title="Shuttle Map"
              path="/shuttle-map"
              NavIcon={MapIcon}
            />
          </li>
          <li>
            <LeftNavLink
              title="Search Map"
              path="/map"
              NavIcon={SearchMapIcon}
              onClick={() => fullStoryEvent("Search Map nav entry clicked", {})}
            />
          </li>
          {inTestGroup(TestGroups.DetoursList) ? (
            <li>
              <LeftNavLink
                title="Detours"
                path="/detours"
                NavIcon={(props: ComponentProps<"span">) => (
                  <span {...props}>
                    <DetourNavIcon />
                  </span>
                )}
              />
            </li>
          ) : null}
        </ul>
        {deviceType === "mobile" && <hr className="w-100 my-0" />}
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
            <LeftNavLink
              title="Settings"
              path="/settings"
              NavIcon={(props: ComponentProps<"span">) => (
                <span {...props}>
                  <GearFill className="c-left-nav__icon c-left-nav__fill" />
                </span>
              )}
            />
          </li>
          {deviceType !== "mobile" && (
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
          )}
        </ul>
      </div>
    </div>
  )
}

const ViewToggle = ({
  NavIcon,
  title,
  viewIsOpen,
  onClick,
  disabled,
}: ButtonData): JSX.Element => {
  const buttonContent = (
    <button
      className={
        "c-left-nav__link c-left-nav__view" +
        (viewIsOpen ? " c-left-nav__view--active" : "") +
        (disabled ? " c-left-nav__view--disabled" : "")
      }
      onClick={onClick}
      title={title}
      aria-disabled={disabled}
    >
      <NavIcon className="c-left-nav__icon" />
      {title}
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
