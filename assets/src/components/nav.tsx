import React, { useContext } from "react"
import { toggleMobileMenu } from "../state"
import appData from "../appData"
import useScreenSize from "../hooks/useScreenSize"
import LeftNav from "./nav/leftNav"
import TopNav from "./nav/topNav"
import MobilePortraitNav from "./nav/mobilePortraitNav"
import { StateDispatchContext } from "../contexts/stateDispatchContext"

interface Props {
  children?: React.ReactNode
  allowViews: boolean
}

const Nav: React.FC<Props> = ({ children, allowViews }) => {
  const [, dispatch] = useContext(StateDispatchContext)
  const deviceType = useScreenSize()

  switch (deviceType) {
    case "mobile":
      return (
        <div className="l-nav--narrow">
          <div className="l-nav__app-content">{children}</div>
          <MobilePortraitNav />
        </div>
      )
    case "mobile_landscape_tablet_portrait":
      return (
        <div className="l-nav--medium">
          <div className="l-nav__app-content">{children}</div>
          <div className="l-nav__nav-bar l-nav__nav-bar--left">
            <LeftNav
              toggleMobileMenu={() => dispatch(toggleMobileMenu())}
              defaultToCollapsed={true}
              dispatcherFlag={readDispatcherFlag()}
              closePickerOnViewOpen={true}
              allowViews={allowViews}
            />
          </div>
        </div>
      )
    case "tablet":
      return (
        <div className="l-nav--medium">
          <div className="l-nav__app-content">{children}</div>
          <div className="l-nav__nav-bar l-nav__nav-bar--left">
            <LeftNav
              toggleMobileMenu={() => dispatch(toggleMobileMenu())}
              defaultToCollapsed={true}
              dispatcherFlag={readDispatcherFlag()}
              allowViews={allowViews}
            />
          </div>
        </div>
      )
    default:
      return (
        <div className="l-nav--wide">
          <div className="l-nav__app-content">{children}</div>
          <div className="l-nav__nav-bar l-nav__nav-bar--top">
            <TopNav />
          </div>
          <div className="l-nav__nav-bar l-nav__nav-bar--left">
            <LeftNav
              defaultToCollapsed={false}
              dispatcherFlag={readDispatcherFlag()}
              allowViews={allowViews}
            />
          </div>
        </div>
      )
  }
}

const readDispatcherFlag = (): boolean => {
  const data = appData()
  if (!data) {
    return false
  }

  return data.dispatcherFlag === "true"
}

export default Nav
