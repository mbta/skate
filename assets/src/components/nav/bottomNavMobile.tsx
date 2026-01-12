import React, { ComponentProps } from "react"
import {
  LadderIcon,
  MapIcon,
  SearchMapIcon,
  SwingIcon,
} from "../../helpers/icon"
import { DetourNavIcon } from "../../helpers/navIcons"
import { NavLink } from "react-router-dom"
import { tagManagerEvent } from "../../helpers/googleTagManager"
import { fullStoryEvent } from "../../helpers/fullStory"
import { ButtonData, LinkData } from "../../navLinkData"
import inTestGroup, { TestGroups } from "../../userInTestGroup"

const BottomNavLink = ({ title, path, onClick, NavIcon }: LinkData) => {
  return (
    <NavLink
      className={({ isActive }) =>
        "c-bottom-nav-mobile__link" +
        (isActive ? " c-bottom-nav-mobile__link--active" : "")
      }
      title={title}
      to={path}
      onClick={onClick}
    >
      <NavIcon className="c-bottom-nav-mobile__icon" />
      <span className="c-bottom-nav-mobile__text">{title}</span>
    </NavLink>
  )
}

const BottomNavButton = ({ title, onClick, NavIcon }: ButtonData) => {
  return (
    <button
      className="c-bottom-nav-mobile__button"
      title={title}
      onClick={onClick}
    >
      <NavIcon className="c-bottom-nav-mobile__icon" />
      <span className="c-bottom-nav-mobile__text">{title}</span>
    </button>
  )
}

interface Props {
  mobileMenuIsOpen: boolean
  openSwingsView: () => void
}

const BottomNavMobile: React.FC<Props> = ({
  mobileMenuIsOpen,
  openSwingsView,
}) => {
  return (
    <nav
      data-testid="bottom-nav-mobile"
      aria-label="Bottom Navigation"
      className={
        "c-bottom-nav-mobile" + (mobileMenuIsOpen ? " blurred-mobile" : "")
      }
    >
      <ul className="c-bottom-nav-mobile__links">
        <li>
          <BottomNavLink title="Routes" path="/" NavIcon={LadderIcon} />
        </li>
        <li>
          <BottomNavButton
            title="Swings"
            onClick={() => {
              tagManagerEvent("swings_view_toggled")
              fullStoryEvent("User opened Swings View", {})
              openSwingsView()
            }}
            NavIcon={() => (
              <SwingIcon className="c-bottom-nav-mobile__icon c-bottom-nav-mobile__icon--swings-view" />
            )}
          />
        </li>
        <li>
          <BottomNavLink
            title="Shuttle"
            path="/shuttle-map"
            NavIcon={MapIcon}
          />
        </li>
        <li>
          <BottomNavLink
            title="Search"
            path="/map"
            NavIcon={SearchMapIcon}
            onClick={() => fullStoryEvent("Search Map nav entry clicked", {})}
          />
        </li>
        {inTestGroup(TestGroups.DetoursList) && (
          <li>
            <BottomNavLink
              title="Detours"
              path="/detours"
              NavIcon={(props: ComponentProps<"span">) => (
                <span {...props}>
                  <DetourNavIcon />
                </span>
              )}
            />
          </li>
        )}
      </ul>
    </nav>
  )
}

export default BottomNavMobile
