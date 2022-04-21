import React from "react"
import { OpenView } from "../state"
import TabBar from "./tabBar"
import appData from "../appData"

interface Props {
  pickerContainerIsVisible: boolean
  openView: OpenView
}

export const Nav: React.FC<Props> = ({
  children,
  pickerContainerIsVisible,
  openView,
}) => {
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

const readDispatcherFlag = (): boolean => {
  const data = appData()
  if (!data) {
    return false
  }

  return data.dispatcherFlag === "true"
}
