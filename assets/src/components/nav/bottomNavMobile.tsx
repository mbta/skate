import React from "react"
import { ladderIcon, mapIcon, searchIcon, swingIcon } from "../../helpers/icon"
import { NavLink } from "react-router-dom"
import { tagManagerEvent } from "../../helpers/googleTagManager"

interface Props {
  mobileMenuIsOpen: boolean
  openSwingsView: () => void
}

const BottomNavMobile: React.FC<Props> = ({
  mobileMenuIsOpen,
  openSwingsView,
}) => (
  <div
    data-testid="bottom-nav-mobile"
    className={
      "m-bottom-nav-mobile" + (mobileMenuIsOpen ? " blurred-mobile" : "")
    }
  >
    <ul className="m-bottom-nav-mobile__links">
      <li>
        <NavLink
          className={({ isActive }) =>
            "m-bottom-nav-mobile__link" +
            (isActive ? " m-bottom-nav-mobile__link--active" : "")
          }
          title="Route Ladders"
          to="/"
        >
          {ladderIcon("m-bottom-nav-mobile__icon")}
        </NavLink>
      </li>

      <li>
        <NavLink
          className={({ isActive }) =>
            "m-bottom-nav-mobile__link" +
            (isActive ? " m-bottom-nav-mobile__link--active" : "")
          }
          title="Shuttle Map"
          to="/shuttle-map"
        >
          {mapIcon("m-bottom-nav-mobile__icon")}
        </NavLink>
      </li>

      <li>
        <NavLink
          className={({ isActive }) =>
            "m-bottom-nav-mobile__link" +
            (isActive ? " m-bottom-nav-mobile__link--active" : "")
          }
          title="Search"
          to="/search"
        >
          {searchIcon("m-bottom-nav-mobile__icon")}
        </NavLink>
      </li>

      <li>
        <button
          className="m-bottom-nav-mobile__button"
          onClick={() => {
            tagManagerEvent("swings_view_toggled")
            openSwingsView()
          }}
          title="Swings View"
        >
          {swingIcon(
            "m-bottom-nav-mobile__icon m-bottom-nav-mobile__icon--swings-view"
          )}
        </button>
      </li>
    </ul>
  </div>
)

export default BottomNavMobile
