import React, { useState, useContext } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { displayHelp } from "../../helpers/appCue"
import { openDrift } from "../../helpers/drift"
import {
  ladderIcon,
  mapIcon,
  searchIcon,
  lateIcon,
  swingIcon,
  doubleChevronRightIcon,
  doubleChevronLeftIcon,
  questionMarkIcon,
  speechBubbleIcon,
} from "../../helpers/icon"
import featureIsEnabled from "../../laboratoryFeatures"
import { OpenView, toggleLateView, toggleSwingsView } from "../../state"

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
  const location = useLocation()

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
              icon={lateIcon("m-left-nav__icon m-left-nav__icon--late-view")}
              name="Late View"
              viewIsOpen={openView === OpenView.Late}
              toggleView={() => dispatch(toggleLateView())}
              collapsed={collapsed}
            />
          </li>
        ) : null}
        <li>
          <ViewToggle
            icon={swingIcon("m-left-nav__icon m-left-nav__icon--swings-view")}
            name="Swings View"
            viewIsOpen={openView === OpenView.Swings}
            toggleView={() => dispatch(toggleSwingsView())}
            collapsed={collapsed}
          />
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
          <button
            className="m-left-nav__link"
            onClick={openDrift}
            title="Support"
          >
            {speechBubbleIcon("m-left-nav__icon")}
            {collapsed ? null : "Support"}
          </button>
        </li>
        <li>
          <button
            className="m-left-nav__link"
            onClick={() => displayHelp(location)}
            title="About Skate"
          >
            {questionMarkIcon("m-left-nav__icon")}
            {collapsed ? null : "About Skate"}
          </button>
        </li>
        <li>
          <button
            className="m-left-nav__link"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed
              ? doubleChevronRightIcon("m-left-nav__icon")
              : doubleChevronLeftIcon("m-left-nav__icon")}
            {collapsed ? null : "Collapse"}
          </button>
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
