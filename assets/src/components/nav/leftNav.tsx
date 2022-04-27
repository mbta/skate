import React, { useState } from "react"
import { NavLink } from "react-router-dom"
import { ladderIcon, mapIcon, searchIcon } from "../../helpers/icon"

interface Props {
  defaultToCollapsed: boolean
}

const LeftNav = ({ defaultToCollapsed }: Props): JSX.Element => {
  const [collapsed, setCollapsed] = useState<boolean>(defaultToCollapsed)

  return (
    <div className={"m-left-nav" + (collapsed ? " m-left-nav--collapsed" : "")}>
      <ul className="m-left-nav__links">
        <li>
          <NavLink
            activeClassName="m-left-nav__link--active"
            className="m-left-nav__link"
            exact={true}
            title="Route Ladders"
            to="/"
          >
            {ladderIcon("m-left-nav__icon")}
            {collapsed ? null : "Route Ladders"}
          </NavLink>
        </li>
        <li>
          <NavLink
            activeClassName="m-left-nav__link--active"
            className="m-left-nav__link"
            exact={true}
            title="Maps"
            to="/shuttle-map"
          >
            {mapIcon("m-left-nav__icon")}
            {collapsed ? null : "Maps"}
          </NavLink>
        </li>
        <li>
          <NavLink
            activeClassName="m-left-nav__link--active"
            className="m-left-nav__link"
            exact={true}
            title="Search"
            to="/search"
          >
            {searchIcon("m-left-nav__icon")}
            {collapsed ? null : "Search"}
          </NavLink>
        </li>
      </ul>
      <ul className="m-left-nav__links">
        <li>
          <button onClick={() => setCollapsed(!collapsed)}>C</button>
        </li>
      </ul>
    </div>
  )
}

export default LeftNav
