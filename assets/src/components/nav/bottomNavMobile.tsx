import React, { useContext } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { ladderIcon, mapIcon, searchIcon, swingIcon } from "../../helpers/icon"
import { NavLink } from "react-router-dom"
import { toggleSwingsView } from "../../state"
import { tagManagerEvent } from "../../helpers/googleTagManager"

const BottomNavMobile = (): JSX.Element => {
  const [state, dispatch] = useContext(StateDispatchContext)

  const { mobileMenuIsOpen } = state

  return (
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
              dispatch(toggleSwingsView())
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
}

export default BottomNavMobile
