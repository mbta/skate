import React from "react"
import { OpenView } from "../state"
import TabBar from "./tabBar"
import appData from "../appData"
import useDeviceType from "../hooks/useDeviceType"

interface Props {
  pickerContainerIsVisible: boolean
  openView: OpenView
}

export const Nav: React.FC<Props> = ({
  children,
  pickerContainerIsVisible,
  openView,
}) => {
  const deviceType = useDeviceType()

  if (readNavBetaFlag()) {
    switch (deviceType) {
      case "mobile":
        return <div>Mobile nav placeholder.</div>
      case "tablet":
        return <div>Tablet nav placeholder.</div>
      default:
        return <div>Desktop nav placeholder.</div>
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
