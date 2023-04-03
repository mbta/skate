import React from "react"
import { Link } from "react-router-dom"
import { LogoIcon, RefreshIcon } from "../../helpers/icon"
import { reload } from "../../models/browser"

const TopNav = (): JSX.Element => {
  return (
    <div className="c-top-nav">
      <Link className="c-top-nav__logo" to="/" title="Skate">
        <LogoIcon className="c-top-nav__logo-icon" />
      </Link>
      <ul className="c-top-nav__right-items">
        <li>
          <button
            className="c-top-nav__right-item"
            onClick={() => reload()}
            title="Refresh"
          >
            <RefreshIcon className="c-top-nav__icon" />
          </button>
        </li>
      </ul>
    </div>
  )
}

export default TopNav
