import React from "react"
import { LadderIcon, MapIcon, SwingIcon } from "../../helpers/icon"
import { NavLink } from "react-router-dom"
import { tagManagerEvent } from "../../helpers/googleTagManager"
import { mapModeForUser } from "../../util/mapMode"
import { fullStoryEvent } from "../../helpers/fullStory"

interface Props {
  mobileMenuIsOpen: boolean
  openSwingsView: () => void
}

const BottomNavMobile: React.FC<Props> = ({
  mobileMenuIsOpen,
  openSwingsView,
}) => {
  const mapMode = mapModeForUser()
  return (
    <div
      data-testid="bottom-nav-mobile"
      className={
        "c-bottom-nav-mobile" + (mobileMenuIsOpen ? " blurred-mobile" : "")
      }
    >
      <ul className="c-bottom-nav-mobile__links">
        <li>
          <NavLink
            className={({ isActive }) =>
              "c-bottom-nav-mobile__link" +
              (isActive ? " c-bottom-nav-mobile__link--active" : "")
            }
            title="Route Ladders"
            to="/"
          >
            <LadderIcon className="c-bottom-nav-mobile__icon" />
          </NavLink>
        </li>

        <li>
          <NavLink
            className={({ isActive }) =>
              "c-bottom-nav-mobile__link" +
              (isActive ? " c-bottom-nav-mobile__link--active" : "")
            }
            title="Shuttle Map"
            to="/shuttle-map"
          >
            <MapIcon className="c-bottom-nav-mobile__icon" />
          </NavLink>
        </li>

        <li>
          <NavLink
            className={({ isActive }) =>
              "c-bottom-nav-mobile__link" +
              (isActive ? " c-bottom-nav-mobile__link--active" : "")
            }
            title={mapMode.title}
            to={mapMode.path}
          >
            <mapMode.navIcon className="c-bottom-nav-mobile__icon" />
          </NavLink>
        </li>

        <li>
          <button
            className="c-bottom-nav-mobile__button"
            onClick={() => {
              tagManagerEvent("swings_view_toggled")
              fullStoryEvent("User opened Swings View")
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
