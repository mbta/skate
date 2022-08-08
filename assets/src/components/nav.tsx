import React, { useContext } from "react"
import { OpenView, toggleMobileMenu } from "../state"
import TabBar from "./tabBar"
import appData from "../appData"
import useDeviceType from "../hooks/useDeviceType"
import featureIsEnabled from "../laboratoryFeatures"
import LeftNav from "./nav/leftNav"
import TopNav from "./nav/topNav"
import MobilePortraitNav from "./nav/mobilePortraitNav"
import { StateDispatchContext } from "../contexts/stateDispatchContext"

interface Props {
  pickerContainerIsVisible: boolean
  openView: OpenView
}

const Nav: React.FC<Props> = ({
  children,
  pickerContainerIsVisible,
  openView,
}) => {
  const [, dispatch] = useContext(StateDispatchContext)
  const deviceType = useDeviceType()

  if (readNavBetaFlag() || featureIsEnabled("nav_beta")) {
    switch (deviceType) {
      case "mobile":
        return <MobilePortraitNav>{children}</MobilePortraitNav>
      case "mobile_landscape_tablet_portrait":
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
  } else {
    return (
      <>
        <TabBar
          pickerContainerIsVisible={pickerContainerIsVisible}
          openView={openView}
          dispatcherFlag={readDispatcherFlag()}
        />
        {children}
      </>
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

const readNavBetaFlag = (): boolean => {
  const data = appData()
  if (!data) {
    return false
  }

  return data.navBetaFlag === "true"
}

export default Nav
