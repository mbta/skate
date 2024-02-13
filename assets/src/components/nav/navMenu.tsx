import React from "react"
import { Link } from "react-router-dom"
import { Nav } from "react-bootstrap"
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
        <div className="p-3">
          <Nav className="flex-column" as="ul">
            <Nav.Item>
              <Nav.Link as={"button"} onClick={reload} className="icon-link">
                <RefreshIcon className="bi" /> Refresh
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
                <SpeechBubbleIcon className="bi" /> Support
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
                <QuestionMarkIcon className="bi" /> About Skate
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                as={Link}
                onClick={toggleMobileMenu}
                title="Settings"
                to="/settings"
                className="nav-link icon-link"
              >
                <SettingsIcon className="bi" /> Settings
              </Nav.Link>
            </Nav.Item>
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
