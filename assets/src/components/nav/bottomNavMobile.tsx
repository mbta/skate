import React from "react"
import { SwingIcon } from "../../helpers/icon"
import { NavLink } from "react-router-dom"
import { tagManagerEvent } from "../../helpers/googleTagManager"
import { fullStoryEvent } from "../../helpers/fullStory"
import { LinkData, getNavLinkData } from "../../navLinkData"

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
  const navLinkData = getNavLinkData()

  return (
    <div
      data-testid="bottom-nav-mobile"
      className={
        "c-bottom-nav-mobile" + (mobileMenuIsOpen ? " blurred-mobile" : "")
      }
    >
      <ul className="c-bottom-nav-mobile__links">
        {navLinkData
          .filter((linkData) => !linkData.hideOnMobile)
          .map((linkData) => (
            <li key={linkData.title}>
              <BottomNavLink linkData={linkData} />
            </li>
          ))}

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
          </button>
        </li>
      </ul>
    </div>
  )
}

export default BottomNavMobile
