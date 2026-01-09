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
import { LinkData } from "../../navLinkData"
import inTestGroup, { TestGroups } from "../../userInTestGroup"

interface BottomNavLinkProps {
  linkData: LinkData
}

const BottomNavLink = ({ linkData }: BottomNavLinkProps) => (
  <NavLink
    className={({ isActive }) =>
      "c-bottom-nav-mobile__link" +
      (isActive ? " c-bottom-nav-mobile__link--active" : "")
    }
    title={linkData.title}
    to={linkData.path}
  >
    <linkData.navIcon className="c-bottom-nav-mobile__icon" />
    <span className="c-bottom-nav-mobile__text">{linkData.title}</span>
  </NavLink>
)

interface Props {
  mobileMenuIsOpen: boolean
  openSwingsView: () => void
}

const BottomNavMobile: React.FC<Props> = ({
  mobileMenuIsOpen,
  openSwingsView,
}) => {
  return (
    <div
      data-testid="bottom-nav-mobile"
      className={
        "c-bottom-nav-mobile" + (mobileMenuIsOpen ? " blurred-mobile" : "")
      }
    >
      <ul className="c-bottom-nav-mobile__links">
        <li>
          <BottomNavLink
            linkData={{
              title: "Routes",
              path: "/",
              navIcon: LadderIcon,
            }}
          />
        </li>
        <li>
          <button
            className="c-bottom-nav-mobile__button"
            onClick={() => {
              tagManagerEvent("swings_view_toggled")
              fullStoryEvent("User opened Swings View", {})
              openSwingsView()
            }}
            title="Swings View"
          >
            <SwingIcon className="c-bottom-nav-mobile__icon c-bottom-nav-mobile__icon--swings-view" />
            <span className="c-bottom-nav-mobile__text">Swings</span>
          </button>
        </li>
        <li>
          <BottomNavLink
            linkData={{
              title: "Shuttle",
              path: "/shuttle-map",
              navIcon: MapIcon,
            }}
          />
        </li>
        <li>
          <BottomNavLink
            linkData={{
              title: "Search",
              path: "/map",
              navIcon: SearchMapIcon,
              onClick: () => fullStoryEvent("Search Map nav entry clicked", {}),
            }}
          />
        </li>
        {inTestGroup(TestGroups.DetoursList) && (
          <li>
            <BottomNavLink
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
        )}
      </ul>
    </div>
  )
}

export default BottomNavMobile
