import React from "react"
import appData from "../appData"
import useScreenSize from "../hooks/useScreenSize"
import LeftNav from "./nav/leftNav"
import TopNav from "./nav/topNav"
import MobilePortraitNav from "./nav/mobilePortraitNav"
import { usePanelStateFromStateDispatchContext } from "../hooks/usePanelState"

interface Props {
  children?: React.ReactNode
}

const Nav: React.FC<Props> = ({ children }) => {
  const deviceType = useScreenSize()

  const { isViewOpen } = usePanelStateFromStateDispatchContext()

  switch (deviceType) {
    case "mobile":
      return (
        <div className="l-nav--narrow">
          <MobilePortraitNav isViewOpen={isViewOpen} />
          <div className="l-nav__app-content">{children}</div>
        </div>
      )
    default:
      return (
        <div className="l-nav--wide">
          <>
            <div
              className="l-nav__nav-bar l-nav__nav-bar--top"
              hidden={
                isViewOpen && deviceType === "mobile_landscape_tablet_portrait"
              }
            >
              <TopNav />
            </div>
            <div
              className="l-nav__nav-bar l-nav__nav-bar--left"
              hidden={
                isViewOpen && deviceType === "mobile_landscape_tablet_portrait"
              }
            >
              <LeftNav
                defaultToCollapsed={
                  deviceType === "mobile_landscape_tablet_portrait" ||
                  deviceType === "tablet"
                }
                key={deviceType}
                dispatcherFlag={readDispatcherFlag()}
              />
            </div>
          </>
          <div className="l-nav__app-content">{children}</div>
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
