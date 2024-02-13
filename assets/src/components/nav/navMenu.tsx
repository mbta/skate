import React from "react"
import { Link } from "react-router-dom"
import { Nav } from "react-bootstrap"
import { displayHelp } from "../../helpers/appCue"
import { openDrift } from "../../helpers/drift"
import { OldCloseIcon, LogoIcon } from "../../helpers/icon"
import * as BsIcon from "../../helpers/bsIcons"
import { joinClasses } from "../../helpers/dom"
import { reload } from "../../models/browser"
import inTestGroup, { TestGroups } from "../../userInTestGroup"

interface Props {
  mobileMenuIsOpen: boolean
  toggleMobileMenu: () => void
}

const NavMenu: React.FC<Props> = ({ mobileMenuIsOpen, toggleMobileMenu }) => {
  const keycloakEnabled = inTestGroup(TestGroups.KeycloakSso)

  return (
    <>
      <div
        data-testid="nav-menu"
        className={joinClasses([
          "c-nav-menu",
          mobileMenuIsOpen ? "c-nav-menu--open" : "c-nav-menu--closed",
          "inherit-box",
          "border-box",
        ])}
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
        <div className="p-3">
          <Nav className="flex-column" as="ul">
            <Nav.Item>
              <Nav.Link as="button" onClick={reload} className="icon-link">
                <BsIcon.ArrowClockwise /> Refresh
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                className="icon-link"
                as="button"
                onClick={() => {
                  openDrift()
                  toggleMobileMenu()
                }}
              >
                <BsIcon.ChatFill /> Support
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                className="icon-link"
                as="button"
                onClick={() => {
                  displayHelp(location)
                  toggleMobileMenu()
                }}
              >
                <BsIcon.QuestionFill /> About Skate
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                as={Link}
                onClick={toggleMobileMenu}
                title="Settings"
                to="/settings"
                className="icon-link"
              >
                <BsIcon.GearFill /> Settings
              </Nav.Link>
            </Nav.Item>
            {keycloakEnabled && (
              <>
                <Nav.Item>
                  <hr />
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    className="icon-link"
                    as="a"
                    href="/auth/keycloak/logout"
                  >
                    <BsIcon.BoxArrowRight /> Logout
                  </Nav.Link>
                </Nav.Item>
              </>
            )}
          </Nav>
        </div>
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
