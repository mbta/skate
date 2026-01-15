import React from "react"
import { Link } from "react-router-dom"
import { Nav } from "react-bootstrap"
import { LogoIcon } from "../../helpers/icon"
import CloseButton from "../closeButton"
import * as BsIcon from "../../helpers/bsIcons"
import { joinClasses } from "../../helpers/dom"
import { reload } from "../../models/browser"
import { LoggedInAs } from "../loggedInAs"
import getEmailAddress from "../../userEmailAddress"
import LeftNav from "./leftNav"

interface Props {
  mobileMenuIsOpen: boolean
  toggleMobileMenu: () => void
}

const NavMenu: React.FC<Props> = ({ mobileMenuIsOpen, toggleMobileMenu }) => {
  const email = getEmailAddress()

  return (
    <>
      {/* ignore static element warning - the container should not appear interactive */}
       {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <nav
        data-testid="nav-menu"
        aria-label="Primary Navigation"
        className={joinClasses([
          "c-nav-menu",
          mobileMenuIsOpen ? "c-nav-menu--open" : "c-nav-menu--closed",
          "inherit-box",
          "border-box",
        ])}
        onClick={(e) => {
          const element = e.target as HTMLElement
          // is the clicked element in a link or button within the nav-menu
          if (element.closest("a") || element.closest("button")) {
            toggleMobileMenu()
          }
        }}
      >
        <div className="c-nav-menu__header">
          <Link className="c-nav-menu__logo" to="/" title="Skate">
            <LogoIcon className="c-nav-menu__logo-icon d-flex align-items-center" />
          </Link>
          <CloseButton closeButtonType="xl_light" onClick={() => {}} />
        </div>
        <div className="p-3 pt-2">
          {email && (
            <>
              <LoggedInAs email={email} className="p-2" />
              <div className="d-flex gap-3">
                <Nav.Link
                  as="button"
                  onClick={reload}
                  className="c-nav-menu__button button-small"
                >
                  <BsIcon.ArrowClockwise /> Refresh
                </Nav.Link>
                <Nav.Link
                  className="c-nav-menu__button button-small"
                  as="a"
                  href="/auth/keycloak/logout"
                >
                  <BsIcon.BoxArrowRight /> Logout
                </Nav.Link>
              </div>
              <hr className="my-3" />
            </>
          )}
          <LeftNav deviceType="mobile" />
        </div>
      </nav>
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
