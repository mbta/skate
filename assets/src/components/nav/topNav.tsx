import React, { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { LogoIcon, RefreshIcon } from "../../helpers/icon"
import { reload } from "../../models/browser"
import { Overlay, Popover } from "react-bootstrap"
import { LoggedInAs } from "../loggedInAs"
import getEmailAddress from "../../userEmailAddress"
import { CircleButton } from "../circleButton"
import { UserAvatar } from "../userAvatar"

const TopNav = (): JSX.Element => {
  const email = getEmailAddress()
  const [showUserPopover, setShowUserPopover] = useState<boolean>(false)
  const userButtonRef = useRef(null)

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
            <Popover className="c-top-nav__popover">
              <Popover.Body>
                <LoggedInAs email={email} />
              </Popover.Body>
            </Popover>
          </Overlay>
        </li>
      </ul>
    </div>
  )
}

export default TopNav
