import React, { useContext } from "react"
import { OpenView, toggleMobileMenu } from "../state"
import appData from "../appData"
import useScreenSize from "../hooks/useScreenSize"
import LeftNav from "./nav/leftNav"
import TopNav from "./nav/topNav"
import MobilePortraitNav from "./nav/mobilePortraitNav"
import { StateDispatchContext } from "../contexts/stateDispatchContext"

interface Props {
  children?: React.ReactNode
  pickerContainerIsVisible: boolean
  openView: OpenView
}

const Nav: React.FC<Props> = ({ children }) => {
  const [, dispatch] = useContext(StateDispatchContext)
  const deviceType = useScreenSize()

  switch (deviceType) {
    case "mobile":
      return <MobilePortraitNav>{children}</MobilePortraitNav>
    case "mobile_landscape_tablet_portrait":
      return (
        <div className="m-nav--medium">
          <div className="m-nav__nav-bar m-nav__nav-bar--left">
            <LeftNav
              toggleMobileMenu={() => dispatch(toggleMobileMenu())}
              defaultToCollapsed={true}
              dispatcherFlag={readDispatcherFlag()}
              closePickerOnViewOpen={true}
            />
          </div>
          <div className="m-nav__app-content">{children}</div>
        </div>
      )
    case "tablet":
      return (
        <div className="m-nav--medium">
          <div className="m-nav__nav-bar m-nav__nav-bar--left">
            <LeftNav
              toggleMobileMenu={() => dispatch(toggleMobileMenu())}
              defaultToCollapsed={true}
              dispatcherFlag={readDispatcherFlag()}
            />
          </div>
          <div className="m-nav__app-content">{children}</div>
        </div>
      )
    default:
      return (
        <div className="m-nav--wide">
          <div className="m-nav__nav-bar m-nav__nav-bar--top">
            <TopNav />
          </div>
          <div className="m-nav__nav-bar m-nav__nav-bar--left">
            <LeftNav
              defaultToCollapsed={false}
              dispatcherFlag={readDispatcherFlag()}
            />
          </div>
          <div className="m-nav__app-content">{children}</div>
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
