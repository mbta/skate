import React from "react"
import { Link, NavLink } from "react-router-dom"
import { displayHelp } from "../../helpers/appCue"
import { openDrift } from "../../helpers/drift"
import {
  OldCloseIcon,
  LogoIcon,
  QuestionMarkIcon,
  RefreshIcon,
  SettingsIcon,
  SpeechBubbleIcon,
} from "../../helpers/icon"
import { reload } from "../../models/browser"

interface Props {
  mobileMenuIsOpen: boolean
  toggleMobileMenu: () => void
}

const NavMenu: React.FC<Props> = ({ mobileMenuIsOpen, toggleMobileMenu }) => {
  return (
    <>
      <div
        data-testid="nav-menu"
        className={
          "m-nav-menu" +
          (mobileMenuIsOpen ? " m-nav-menu--open" : " m-nav-menu--closed")
        }
      >
        <div className="m-nav-menu__header">
          <Link
            className="m-nav-menu__logo"
            onClick={toggleMobileMenu}
            to="/"
            title="Skate"
          >
            <LogoIcon className="m-nav-menu__logo-icon" />
          </Link>

          <button
            className="m-nav-menu__close"
            onClick={toggleMobileMenu}
            title="Close"
          >
            <OldCloseIcon className="m-nav-menu__close-icon" />
          </button>
        </div>
        <ul className="m-nav-menu__links">
          <li>
            <button
              className="m-nav-menu__button"
              onClick={reload}
              title="Refresh"
            >
              <RefreshIcon className="m-nav-menu__icon" />
              Refresh
            </button>
          </li>
          <li>
            <button
              className="m-nav-menu__button"
              onClick={() => {
                openDrift()
                toggleMobileMenu()
              }}
              title="Support"
            >
              <SpeechBubbleIcon className="m-nav-menu__icon" />
              Support
            </button>
          </li>
          <li>
            <button
              className="m-nav-menu__button"
              onClick={() => {
                displayHelp(location)
                toggleMobileMenu()
              }}
              title="About Skate"
            >
              <QuestionMarkIcon className="m-nav-menu__icon" />
              About Skate
            </button>
          </li>

          <li>
            <NavLink
              className={({ isActive }) =>
                "m-nav-menu__link" +
                (isActive ? " m-nav-menu__link--active" : "")
              }
              title="Settings"
              to="/settings"
              onClick={toggleMobileMenu}
            >
              <SettingsIcon className="m-nav-menu__icon" />
              Settings
            </NavLink>
          </li>
        </ul>
      </div>
      <div
        data-testid="nav-menu-overlay"
        className={
          "m-nav-menu__overlay" +
          (mobileMenuIsOpen ? " m-nav-menu__overlay--open" : "")
        }
        onClick={toggleMobileMenu}
        onKeyDown={toggleMobileMenu}
        aria-hidden={true}
      />
    </>
  )
}

export default NavMenu
