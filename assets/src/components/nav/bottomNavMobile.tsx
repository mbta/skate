import React, { useContext } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { ladderIcon, mapIcon, searchIcon, swingIcon } from "../../helpers/icon"
import { NavLink } from "react-router-dom"
import { toggleSwingsView } from "../../state"

const BottomNavMobile = (): JSX.Element => {
  const [, dispatch] = useContext(StateDispatchContext)

  return (
    <div className="m-bottom-nav-mobile" data-testid="bottom-nav-mobile">
      <ul className="m-bottom-nav-mobile__links">
        <li>
          <NavLink
            className="m-bottom-nav-mobile__link"
            activeClassName="m-bottom-nav-mobile__link--active"
            exact={true}
            title="Route Ladders"
            to="/"
          >
            {ladderIcon("m-bottom-nav-mobile__icon")}
          </NavLink>
        </li>

        <li>
          <NavLink
            className="m-bottom-nav-mobile__link"
            activeClassName="m-bottom-nav-mobile__link--active"
            exact={true}
            title="Shuttle Map"
            to="/shuttle-map"
          >
            {mapIcon("m-bottom-nav-mobile__icon")}
          </NavLink>
        </li>

        <li>
          <NavLink
            className="m-bottom-nav-mobile__link"
            activeClassName="m-bottom-nav-mobile__link--active"
            exact={true}
            title="Search"
            to="/search"
          >
            {searchIcon("m-bottom-nav-mobile__icon")}
          </NavLink>
        </li>

        <li>
          <button
            className="m-bottom-nav-mobile__button"
            onClick={() => dispatch(toggleSwingsView())}
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
