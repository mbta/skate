import React, { useState, useContext } from "react"
import { NavLink } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { ladderIcon, mapIcon, searchIcon, lateIcon } from "../../helpers/icon"
import featureIsEnabled from "../../laboratoryFeatures"
import { OpenView, toggleLateView } from "../../state"

interface Props {
  defaultToCollapsed: boolean
  dispatcherFlag: boolean
}

const LeftNav = ({
  defaultToCollapsed,
  dispatcherFlag,
}: Props): JSX.Element => {
  const [{ openView }, dispatch] = useContext(StateDispatchContext)
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
        {featureIsEnabled("late_view") || dispatcherFlag ? (
          <li>
            <ViewToggle
              icon={lateIcon("m-left-nav__icon")}
              name="Late View"
              viewIsOpen={openView === OpenView.Late}
              toggleView={() => dispatch(toggleLateView())}
              collapsed={collapsed}
            />
          </li>
        ) : null}
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

const ViewToggle = ({
  icon,
  name,
  viewIsOpen,
  toggleView,
  collapsed,
}: {
  icon: JSX.Element
  name: string
  viewIsOpen: boolean
  toggleView: () => void
  collapsed: boolean
}): JSX.Element => {
  return (
    <button
      className={
        "m-left-nav__link" + (viewIsOpen ? " m-left-nav__link--active" : "")
      }
      onClick={toggleView}
      title={name}
    >
      {icon}
      {collapsed ? null : name}
    </button>
  )
}

export default LeftNav
