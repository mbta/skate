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
import { LoggedInAs } from "../loggedInAs"
import inTestGroup, { TestGroups } from "../../userInTestGroup"
import getEmailAddress from "../../userEmailAddress"

interface Props {
  mobileMenuIsOpen: boolean
  toggleMobileMenu: () => void
}

const NavMenu: React.FC<Props> = ({ mobileMenuIsOpen, toggleMobileMenu }) => {
  const showLoggedInUser = inTestGroup(TestGroups.KeycloakSso)
  const email = getEmailAddress()
  return (
    <>
      <div
        data-testid="nav-menu"
        className={
          "c-nav-menu" +
          (mobileMenuIsOpen ? " c-nav-menu--open" : " c-nav-menu--closed")
        }
      >
        <div className="c-nav-menu__header">
          <Link
            className="c-nav-menu__logo"
            onClick={toggleMobileMenu}
            to="/"
            title="Skate"
          >
            <LogoIcon className="c-nav-menu__logo-icon" />
          </Link>

          <button
            className="c-nav-menu__close"
            onClick={toggleMobileMenu}
            title="Close"
          >
            <OldCloseIcon className="c-nav-menu__close-icon" />
          </button>
        </div>
        {showLoggedInUser && (
          <>
            <div className="c-nav-menu__logged-in-as">
              <LoggedInAs email={email} />
            </div>
            <div className="c-nav-menu__divider" />
          </>
        )}
        <ul className="c-nav-menu__links">
          <li>
            <button
              className="c-nav-menu__button"
              onClick={reload}
              title="Refresh"
            >
              <RefreshIcon className="c-nav-menu__icon" />
              Refresh
            </button>
          </li>
          <li>
            <button
              className="c-nav-menu__button"
              onClick={() => {
                openDrift()
                toggleMobileMenu()
              }}
              title="Support"
            >
              <SpeechBubbleIcon className="c-nav-menu__icon" />
              Support
            </button>
          </li>
          <li>
            <button
              className="c-nav-menu__button"
              onClick={() => {
                displayHelp(location)
                toggleMobileMenu()
              }}
              title="About Skate"
            >
              <QuestionMarkIcon className="c-nav-menu__icon" />
              About Skate
            </button>
          </li>

          <li>
            <NavLink
              className={({ isActive }) =>
                "c-nav-menu__link" +
                (isActive ? " c-nav-menu__link--active" : "")
              }
              title="Settings"
              to="/settings"
              onClick={toggleMobileMenu}
            >
              <SettingsIcon className="c-nav-menu__icon" />
              Settings
            </NavLink>
          </li>
        </ul>
      </div>
      {mobileMenuIsOpen && (
        <div
          data-testid="nav-menu-backdrop"
          className={"c-nav-menu-backdrop"}
          onClick={toggleMobileMenu}
          onKeyDown={toggleMobileMenu}
          aria-hidden={true}
        />
      )}
    </>
  )
}

export default NavMenu
