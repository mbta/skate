import React from "react"
import { OpenView } from "../state"
import TabBar from "./tabBar"
import appData from "../appData"
import useDeviceType from "../hooks/useDeviceType"
import featureIsEnabled from "../laboratoryFeatures"
import LeftNav from "./nav/leftNav"

interface Props {
  pickerContainerIsVisible: boolean
  openView: OpenView
}

const Nav: React.FC<Props> = ({
  children,
  pickerContainerIsVisible,
  openView,
}) => {
  const deviceType = useDeviceType()

  if (readNavBetaFlag() || featureIsEnabled("nav_beta")) {
    switch (deviceType) {
      case "mobile":
        return <div className="m-nav--narrow">Mobile nav placeholder.</div>
      case "tablet":
        return (
          <div className="m-nav--wide">
            <div className="m-nav__nav-bar">
              <LeftNav defaultToCollapsed={true} />
            </div>
            <div>{children}</div>
          </div>
        )
      default:
        return (
          <div className="m-nav--wide">
            <div className="m-nav__nav-bar">
              <LeftNav defaultToCollapsed={false} />
            </div>
            <div>{children}</div>
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
