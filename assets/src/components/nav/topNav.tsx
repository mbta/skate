import React, { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { LogoIcon, RefreshIcon } from "../../helpers/icon"
import * as BsIcon from "../../helpers/bsIcons"
import { reload } from "../../models/browser"
import { Overlay, Popover, Dropdown } from "react-bootstrap"
import { LoggedInAs } from "../loggedInAs"
import getEmailAddress from "../../userEmailAddress"
import { CircleButton } from "../circleButton"
import { UserAvatar } from "../userAvatar"
import { todayIsHalloween } from "../../helpers/date"

const TopNav = (): JSX.Element => {
  const email = getEmailAddress()
  const [showUserPopover, setShowUserPopover] = useState<boolean>(false)
  const userButtonRef = useRef(null)

  return (
    <div className="c-top-nav">
      <Link className="c-top-nav__logo" to="/" title="Skate">
        {todayIsHalloween() ? (
          <HalloweenIcon className="c-top-nav__logo-icon c-top-nav__logo-halloween-icon" />
        ) : (
          <LogoIcon className="c-top-nav__logo-icon" />
        )}
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
        <li>
          <div ref={userButtonRef}>
            <CircleButton
              isActive={showUserPopover}
              onClick={() => {
                setShowUserPopover(!showUserPopover)
              }}
              title="User Info"
            >
              <UserAvatar userName={email} />
            </CircleButton>
          </div>
          <Overlay
            target={userButtonRef.current}
            show={showUserPopover}
            placement="bottom"
          >
            <Popover className="c-top-nav__popover inherit-box border-box">
              <Popover.Body className="p-0">
                <Dropdown.Menu show className="position-static border border-0">
                  <Dropdown.ItemText>
                    <LoggedInAs email={email} />
                  </Dropdown.ItemText>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    href="/auth/keycloak/logout"
                    className="icon-link"
                  >
                    <BsIcon.BoxArrowRight className="me-2" /> Log out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Popover.Body>
            </Popover>
          </Overlay>
        </li>
      </ul>
    </div>
  )
}

export const HalloweenIcon = (props: BsIcon.SvgProps) => (
  <svg
    viewBox="0 -25 55.49 72"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    {...props}
  >
    <path d="m6.74 17.1a42.17 42.17 0 0 0 18.33 3.31 2 2 0 0 1 2 2v1.59a2 2 0 0 0 1.93 2h3.83a2 2 0 0 0 1.93-2v-2a2 2 0 0 1 1.56-2 75.22 75.22 0 0 0 12.55-3.47 2 2 0 0 1 2.13 3.19c-3.66 4.47-10.74 9.71-24 9.71-12 0-18.82-4.83-22.46-9.18a2 2 0 0 1 2.2-3.15z" />
    <g fillRule="evenodd">
      <path d="m19.37 11a1.71 1.71 0 0 1 -1.68 1.41h-12.16a1.68 1.68 0 0 1 -1.2-.5 1.67 1.67 0 0 1 -.5-1.2 1.73 1.73 0 0 1 .31-1l6.08-8.6a1.68 1.68 0 0 1 1.1-.69 1.66 1.66 0 0 1 1.27.28 1.6 1.6 0 0 1 .41.41l6.08 8.6a1.71 1.71 0 0 1 .29 1.29z" />
      <path d="m51.37 11a1.71 1.71 0 0 1 -1.68 1.41h-12.16a1.68 1.68 0 0 1 -1.2-.5 1.67 1.67 0 0 1 -.5-1.2 1.73 1.73 0 0 1 .31-1l6.08-8.6a1.68 1.68 0 0 1 1.1-.69 1.66 1.66 0 0 1 1.27.28 1.6 1.6 0 0 1 .41.41l6.08 8.6a1.71 1.71 0 0 1 .29 1.29z" />
      <path d="m31 16.84a.7.7 0 0 1 -.29.46.69.69 0 0 1 -.41.13h-5.09a.71.71 0 0 1 -.5-.21.68.68 0 0 1 -.21-.5.76.76 0 0 1 .13-.41l2.54-3.58a.7.7 0 0 1 .45-.29.72.72 0 0 1 .53.12.69.69 0 0 1 .17.17l2.54 3.58a.72.72 0 0 1 .14.53z" />
    </g>
  </svg>
)

export default TopNav
